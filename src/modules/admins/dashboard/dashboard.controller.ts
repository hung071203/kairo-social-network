import {
  BadRequestException,
  Controller,
  Get,
  Render,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';

@Controller('dashboard')
@UseGuards(ModeratorsAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @UseFilters(WebExceptionFilter)
  @Render('admins/pages/dashboard/index.njk')
  async getDashboard() {
    try {
      const statistics = await this.dashboardService.getDashboardStatistics();

      return {
        title: 'Dashboard',
        content: 'admins/pages/dashboard/index.njk',
        ...statistics,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  @Get('api/user-growth')
  async getUserGrowthChart() {
    try {
      return await this.dashboardService.getUserGrowthChart();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('api/post-growth')
  async getPostGrowthChart() {
    try {
      return await this.dashboardService.getPostGrowthChart();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('api/reports-by-type')
  async getReportsByType() {
    try {
      return await this.dashboardService.getReportsByType();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
