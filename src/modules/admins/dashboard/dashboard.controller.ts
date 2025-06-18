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
    return {
      title: 'Dashboard',
      content: 'admins/pages/dashboard/index.njk',
      data: {},
    };
  }
}
