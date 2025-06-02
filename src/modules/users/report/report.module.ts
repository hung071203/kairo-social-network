import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report, ReportSchema } from 'src/schemas/reports.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportRepository } from 'src/database/repository/report.repository';
import { FollowModule } from '../follow/follow.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Report.name,
        schema: ReportSchema,
      },
    ]),
    FollowModule
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    {
      provide: 'ReportRepositoryInterface',
      useClass: ReportRepository,
    },
  ],
})
export class ReportModule {}
