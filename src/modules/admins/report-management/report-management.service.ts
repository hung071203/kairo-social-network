import { Inject, Injectable } from '@nestjs/common';
import { ReportRepositoryInterface } from 'src/database/interface/report.interface';
import { FilterReportManagementDto } from './dto/report.dto';
import { PaginationDto } from 'src/common/decorators';
import { isValidObjectId, Types } from 'mongoose';
import { UserRepositoryInterface } from 'src/database/interface/user.interface';
import { PostRepositoryInterface } from 'src/database/interface/post.interface';

@Injectable()
export class ReportManagementService {
  constructor(
    @Inject('ReportRepositoryInterface')
    private readonly reportRepository: ReportRepositoryInterface,
  ) {}

  async getAllReports(
    dto: FilterReportManagementDto,
    pagination: PaginationDto,
  ) {
    const form: any = {};

    if (dto.search && dto.search.trim()) {
      const searchTerm = dto.search.trim();

      // Nếu là ObjectId hợp lệ → tìm chính xác theo _id
      if (isValidObjectId(searchTerm)) {
        form._id = searchTerm;
      } else {
        // Escape special regex characters
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        form.$or = [{ reason: { $regex: escapedSearch, $options: 'i' } }];
      }
    }

    if (dto.type) {
      form.type = dto.type;
    }

    if (dto.isResolved !== undefined) {
      if (dto.isResolved == true) {
        form.responder = { $exists: true }; // Báo cáo đã được xử lý
      } else {
        form.responder = { $exists: false }; // Báo cáo chưa được xử lý
      }
    }
    return this.reportRepository.findAll(form, {
      ...pagination,
      populate: [
        { path: 'reporter', select: 'name username email avatar' },
        { path: 'responder', select: 'name username email avatar' },
      ],
    });
  }
  async getReportDetail(reportId: string) {
    if (!isValidObjectId(reportId)) {
      throw new Error('ID báo cáo không hợp lệ');
    }

    const report = await this.reportRepository
      .getModel()
      .findById(reportId)
      .populate('reporter', 'name username email avatar')
      .populate('responder', 'name username email avatar')
      .exec();

    if (!report) {
      throw new Error('Không tìm thấy báo cáo');
    }

    return report;
  }

  async resolveReport(
    reportId: string,
    responderId: string,
    responseContent?: string,
  ) {
    if (!isValidObjectId(reportId)) {
      throw new Error('ID báo cáo không hợp lệ');
    }

    if (!isValidObjectId(responderId)) {
      throw new Error('ID người xử lý không hợp lệ');
    }

    const report = await this.reportRepository.findOne({ _id: reportId });
    if (!report) {
      throw new Error('Không tìm thấy báo cáo');
    }

    if (report.responder) {
      throw new Error('Báo cáo này đã được xử lý');
    }
    await this.reportRepository.update(reportId, {
      responder: new Types.ObjectId(responderId),
      responseContent: responseContent || 'Đã xử lý báo cáo',
    });

    return true;
  }
}
