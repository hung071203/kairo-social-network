import { Inject, Injectable } from '@nestjs/common';
import { ReportRepositoryInterface } from 'src/database/interface/report.interface';
import { FilterReportManagementDto } from './dto/report.dto';
import { PaginationDto } from 'src/common/decorators';
import { isValidObjectId } from 'mongoose';

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
        console.log('Searching by ObjectId');
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
      populate: [{ path: 'reporter', select: 'name username email avatar' }],
    });
  }
}
