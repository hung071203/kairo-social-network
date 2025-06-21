import { Inject, Injectable } from '@nestjs/common';
import { ReportRepositoryInterface } from 'src/database/interface/report.interface';
import { CreateReportDto } from './dto/report.dto';
import { NotificationType, ReportType } from 'src/common/enums';
import { FollowService } from '../follow/follow.service';
import { Types } from 'mongoose';
import { NotificationService } from '../notification/notification.service';
import { ProfileService } from '../profile/profile.service';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class ReportService {
  constructor(
    @Inject('ReportRepositoryInterface')
    private readonly reportRepository: ReportRepositoryInterface,
    private readonly followService: FollowService,
    private readonly notificationService: NotificationService, // Assuming you have a NotificationService for sending notifications
    private readonly profileService: ProfileService, // Assuming you have a ProfileService for user profile operations
    private readonly postsService: PostsService, // Assuming you have a PostService for post operations
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

    const admins = await this.profileService.getAllAdminAndMod();
    //TODO: Add notification for admins
    const notificationPromises = admins.map((admin) =>
      this.notificationService.create(admin._id.toString(), {
        title: `Báo cáo ${dto.type == ReportType.POST ? 'bài đăng' : 'người dùng'} mới!`,
        message: `Có báo cáo mới về ${dto.type == ReportType.POST ? 'bài đăng' : 'người dùng'}, click để xem chi tiết.`,
        type: NotificationType.REPORT,
        redirectUrl: `/report-management?search=${data._id}`,
      }),
    );
    await Promise.allSettled(notificationPromises);
    return data;
  }

  async getReportDetail(reportId: string, userId: string): Promise<any> {
    const report = await this.reportRepository
      .getModel()
      .findOne({
        _id: new Types.ObjectId(reportId),
        reporter: new Types.ObjectId(userId),
      })
      .populate('reporter', 'name username email avatar')
      .populate('responder', 'name username email avatar')
      .exec();

    if (!report) {
      throw new Error('Báo cáo không tồn tại hoặc bạn không có quyền truy cập');
    }

    if (!report.responder) {
      throw new Error('Báo cáo chưa được xử lý');
    }

    let targetDetails = null;
    if (report.type === ReportType.POST) {
      targetDetails = await this.postsService
        .getRepository()
        .getModel()
        .findOne({
          _id: report.target,
        })
        .populate('author', 'name username email avatar')
        .exec();
    } else if (report.type === ReportType.USER) {
      targetDetails = await this.profileService
        .getRepository()
        .getModel()
        .findOne({
          _id: report.target,
        })
        .exec();
    }

    return {
      ...report.toObject(),
      targetDetails,
    }
  }
}
