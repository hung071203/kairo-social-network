import { Controller, Get, Render, UseFilters, UseGuards } from '@nestjs/common';
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
    const statistics = await this.dashboardService.getDashboardStatistics();
    
    return {
      title: 'Dashboard',
      content: 'admins/pages/dashboard/index.njk',
      ...statistics,
    };
  }

  @Get('api/user-growth')
  async getUserGrowthChart() {
    return await this.dashboardService.getUserGrowthChart();
  }

  @Get('api/post-growth')
  async getPostGrowthChart() {
    return await this.dashboardService.getPostGrowthChart();
  }

  @Get('api/reports-by-type')
  async getReportsByType() {
    return await this.dashboardService.getReportsByType();
  }
}
