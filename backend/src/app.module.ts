import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module.js';
import { DatabaseModule } from './database/database.module.js';
import { ReceptionModule } from './modules/reception/reception.module.js';

@Module({ imports: [DatabaseModule, HealthModule, ReceptionModule] })
export class AppModule {}
