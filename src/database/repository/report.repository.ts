import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Report } from 'src/schemas/reports.schema';
import { ReportRepositoryInterface } from '../interface/report.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ReportRepository
  extends BaseRepository<Report>
  implements ReportRepositoryInterface
{
  constructor(
    @InjectModel(Report.name)
    private readonly reportRepository: PaginateModel<Report>,
  ) {
    super(reportRepository);
  }
}
