import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as admin from 'firebase-admin';

export const FIREBASE_ADMIN = Symbol('FIREBASE_ADMIN');

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_ADMIN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        if (admin.apps.length) return admin.app();

        const serviceAccountPath = config.get<string>(
          'FIREBASE_SERVICE_ACCOUNT_PATH',
        );

        if (!serviceAccountPath) {
          return null;
        }

        const absolutePath = resolve(process.cwd(), serviceAccountPath);
        const serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf8'));

        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      },
    },
  ],
  exports: [FIREBASE_ADMIN],
})
export class FirebaseModule {}
