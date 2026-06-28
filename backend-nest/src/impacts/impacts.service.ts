import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { riskConfig } from '../config/risk.config';
import {
  Observation,
  ObservationDocument,
} from '../observations/schemas/observation.schema';
import { Impact, ImpactDocument } from './schemas/impact.schema';

@Injectable()
export class ImpactsService {
  constructor(
    @InjectModel(Impact.name)
    private readonly impactModel: Model<ImpactDocument>,
    @InjectModel(Observation.name)
    private readonly observationModel: Model<ObservationDocument>,
  ) {}

  qualifiesForHeavyRainImpact(observation: ObservationDocument, now = new Date()) {
    if (observation.type !== 'weather.heavy_rain_forecast') return false;
    const probability =
      Number(observation.payload?.precipitationProbability) || 0;
    const etaMs = new Date(observation.timestamp).getTime() - now.getTime();
    const maxEtaMs =
      riskConfig.impacts.heavyRainMaxEtaHours * 60 * 60 * 1000;
    return probability >= 70 && etaMs >= 0 && etaMs <= maxEtaMs;
  }

  buildHeavyRainImpact(observation: ObservationDocument, now = new Date()) {
    const probability =
      Number(observation.payload?.precipitationProbability) || 0;
    return {
      sourceObservationId: observation._id as Types.ObjectId,
      type: 'weather.heavy_rain_possible',
      domain: 'weather',
      severity: probability >= 90 ? 'warning' : 'watch',
      location: observation.location,
      radiusMeters: riskConfig.impacts.defaultRadiusMeters,
      eta: observation.timestamp,
      confidence: probability / 100,
      reason: {
        observationType: observation.type,
        precipitationProbability: probability,
        precipitationMm: observation.payload?.precipitationMm,
      },
      status: 'active',
      validFrom: now,
      validUntil: new Date(
        new Date(observation.timestamp).getTime() +
          riskConfig.impacts.validityMinutes * 60 * 1000,
      ),
    };
  }

  async runHeavyRainImpactWorker(now = new Date()) {
    const observations = await this.observationModel.find({
      type: 'weather.heavy_rain_forecast',
      timestamp: {
        $gte: now,
        $lte: new Date(
          now.getTime() +
            riskConfig.impacts.heavyRainMaxEtaHours * 60 * 60 * 1000,
        ),
      },
    });

    let created = 0;
    for (const observation of observations) {
      if (!this.qualifiesForHeavyRainImpact(observation, now)) continue;
      const impact = this.buildHeavyRainImpact(observation, now);
      const result = await this.impactModel.updateOne(
        {
          sourceObservationId: impact.sourceObservationId,
          type: impact.type,
        },
        { $setOnInsert: impact },
        { upsert: true },
      );
      if (result.upsertedCount) created += 1;
    }

    await this.impactModel.updateMany(
      { status: 'active', validUntil: { $lt: now } },
      { $set: { status: 'expired' } },
    );

    return { examined: observations.length, created };
  }

  async findActive(now = new Date()) {
    return this.impactModel.find({
      status: 'active',
      validUntil: { $gte: now },
    });
  }
}
