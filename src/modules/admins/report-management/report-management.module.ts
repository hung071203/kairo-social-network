import { Module } from '@nestjs/common';
import { ReportManagementService } from './report-management.service';
import { ReportManagementController } from './report-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from 'src/schemas/reports.schema';
import { ReportRepository } from 'src/database/repository/report.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Report.name,
        schema: ReportSchema,
      },
    ]),
  ],
  controllers: [ReportManagementController],
  providers: [ReportManagementService,
    {
      provide: 'ReportRepositoryInterface',
      useClass: ReportRepository
    }
  ],
})
export class ReportManagementModule {}
