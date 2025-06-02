import { Inject, Injectable } from '@nestjs/common';
import { ReportRepositoryInterface } from 'src/database/interface/report.interface';
import { CreateReportDto } from './dto/report.dto';
import { ReportType } from 'src/common/enums';
import { FollowService } from '../follow/follow.service';
import { Types } from 'mongoose';

@Injectable()
export class ReportService {
  constructor(
    @Inject('ReportRepositoryInterface')
    private readonly reportRepository: ReportRepositoryInterface,
    private readonly followService: FollowService,
  ) {}

  async createReport(userId: string, dto: CreateReportDto): Promise<any> {
    if (dto.type === ReportType.USER && dto.blockUser) {
      // If the report is about a user and the user wants to block them,
      // we first block the user before creating the report.
      await this.followService.blockUser(userId, dto.target);
    }

    // Implementation for creating a report
    return this.reportRepository.create({
      reporter: new Types.ObjectId(userId),
      type: dto.type,
      target: new Types.ObjectId(dto.target),
      reason: dto.reason,
    });
  }
}
