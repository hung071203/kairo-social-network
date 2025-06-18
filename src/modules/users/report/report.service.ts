import { Inject, Injectable } from '@nestjs/common';
import { ReportRepositoryInterface } from 'src/database/interface/report.interface';
import { CreateReportDto } from './dto/report.dto';
import { NotificationType, ReportType } from 'src/common/enums';
import { FollowService } from '../follow/follow.service';
import { Types } from 'mongoose';
import { NotificationService } from '../notification/notification.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class ReportService {
  constructor(
    @Inject('ReportRepositoryInterface')
    private readonly reportRepository: ReportRepositoryInterface,
    private readonly followService: FollowService,
    private readonly notificationService: NotificationService, // Assuming you have a NotificationService for sending notifications
    private readonly profileService: ProfileService, // Assuming you have a ProfileService for user profile operations
  ) {}

  async createReport(userId: string, dto: CreateReportDto): Promise<any> {
    if (dto.type === ReportType.USER && dto.blockUser) {
      // If the report is about a user and the user wants to block them,
      // we first block the user before creating the report.
      await this.followService.blockUser(userId, dto.target);
    }

    // Implementation for creating a report
    const data = await this.reportRepository.create({
      reporter: new Types.ObjectId(userId),
      type: dto.type,
      target: new Types.ObjectId(dto.target),
      reason: dto.reason,
    });

    const admins = await this.profileService.getAllAdminAndMod()
    //TODO: Add notification for admins
    const notificationPromises = admins.map((admin) =>
      this.notificationService.create(admin._id.toString(), {
        title: 'Báo cáo ' + dto.type + ' mới',
        message: `Người dùng có id ${userId} đã báo cáo ${dto.type} với lý do: ${dto.reason}`,
        type: NotificationType.SYSTEM,
      }),
    );
    await Promise.allSettled(notificationPromises);
    return data;
  }
}
