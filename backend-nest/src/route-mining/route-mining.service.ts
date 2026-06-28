import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RouteRelation,
  RouteRelationDocument,
} from './schemas/route-relation.schema';

export type RelationEvidenceInput = {
  fromType: string;
  toType: string;
  domain: string;
  observedCount?: number;
  sourceDiversity?: number;
  avgDelayMinutes?: number;
  avgDistanceMeters?: number;
  lastSeenAt?: Date;
  observerReliability?: number;
  isCandidate?: boolean;
  isDisputed?: boolean;
};

export type ConfidenceInput = {
  observedCount: number;
  sourceDiversity: number;
  lastSeenAgeMinutes: number;
  observerReliability: number;
  isCandidate: boolean;
  isDisputed: boolean;
};

@Injectable()
export class RouteMiningService {
  constructor(
    @InjectModel(RouteRelation.name)
    private readonly routeRelationModel: Model<RouteRelationDocument>,
  ) {}

  calculateConfidence(input: ConfidenceInput) {
    const frequency = 1 - Math.exp(-input.observedCount / 38);
    const diversity = Math.min(1, 0.55 + input.sourceDiversity * 0.15);
    const recency = Math.exp(-0.018 * input.lastSeenAgeMinutes);
    const candidatePenalty = input.isCandidate ? 0.72 : 1;
    const disputedPenalty = input.isDisputed ? 0.55 : 1;

    return Math.max(
      0,
      Math.min(
        1,
        frequency *
          diversity *
          recency *
          input.observerReliability *
          candidatePenalty *
          disputedPenalty,
      ),
    );
  }

  async list() {
    return this.routeRelationModel.find().sort({ confidence: -1, updatedAt: -1 });
  }

  async upsertEvidence(input: RelationEvidenceInput) {
    const lastSeenAt = input.lastSeenAt || new Date();
    const lastSeenAgeMinutes = Math.max(
      0,
      (Date.now() - lastSeenAt.getTime()) / 60000,
    );
    const observedCount = input.observedCount ?? 1;
    const sourceDiversity = input.sourceDiversity ?? 1;
    const observerReliability = input.observerReliability ?? 0.7;
    const isCandidate = input.isCandidate ?? true;
    const isDisputed = input.isDisputed ?? false;

    const confidence = this.calculateConfidence({
      observedCount,
      sourceDiversity,
      lastSeenAgeMinutes,
      observerReliability,
      isCandidate,
      isDisputed,
    });

    return this.routeRelationModel.findOneAndUpdate(
      {
        fromType: input.fromType,
        toType: input.toType,
        domain: input.domain,
      },
      {
        $set: {
          avgDelayMinutes: input.avgDelayMinutes ?? 0,
          avgDistanceMeters: input.avgDistanceMeters ?? 0,
          lastSeenAt,
          observerReliability,
          confidence,
          isCandidate,
          isDisputed,
        },
        $inc: {
          observedCount,
        },
        $max: {
          sourceDiversity,
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true },
    );
  }
}
