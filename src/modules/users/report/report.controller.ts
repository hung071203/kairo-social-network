import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { GetUser } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';
import { CreateReportDto } from './dto/report.dto';
import { WebExceptionFilter } from 'src/common/filters';

@Controller('reports')
@UseGuards(UsersAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async createReport(@GetUser() user: User, @Body() dto: CreateReportDto) {
    // Implementation for creating a report
    try {
      return await this.reportService.createReport(user._id as string, dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('detail/:id')
  @Render('admins/pages/reports/detail.njk')
  @UseFilters(WebExceptionFilter)
  async getReportDetail(@Param('id') id: string, @GetUser() user: User) {
    // Implementation for getting report details
    try {
      const report = await this.reportService.getReportDetail(
        id,
        user._id.toString(),
      );
      console.log('report', report);
      
      return {
        title: 'Chi tiết báo cáo',
        content: 'users/pages/reports/detail.njk',
        ...report,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
