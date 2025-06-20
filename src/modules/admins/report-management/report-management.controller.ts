import { BadRequestException, Controller, Get, Query, Render, UseFilters, UseGuards } from '@nestjs/common';
import { ReportManagementService } from './report-management.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';
import { Pagination, PaginationDto } from 'src/common/decorators';
import { FilterReportManagementDto } from './dto/report.dto';

@Controller('report-management')
@UseGuards(ModeratorsAuthGuard)
export class ReportManagementController {
  constructor(private readonly reportManagementService: ReportManagementService) {}

  @Get()
  @Render('admins/pages/reports/index.njk')
  @UseFilters(WebExceptionFilter)
  async getReportManagement(
    @Query() query: FilterReportManagementDto, // Uncomment if you have filtering
    @Pagination() pagination: PaginationDto, // Uncomment if you have pagination
  ) {
    try {
      const data = await this.reportManagementService.getAllReports(query, pagination);
      return {
        title: 'Quản lý báo cáo',
        content: 'admins/pages/reports/index.njk',
        data,
        query, // Pass query params to template for sorting
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
