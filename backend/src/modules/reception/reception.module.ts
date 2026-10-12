import { Module } from '@nestjs/common';
import { ReceptionController } from './reception.controller.js';
import { ReceptionService } from './reception.service.js';
import { LocalPdfStorage } from '../../storage/local-pdf.storage.js';

@Module({
  controllers: [ReceptionController],
  providers: [ReceptionService, LocalPdfStorage],
})
export class ReceptionModule {}
