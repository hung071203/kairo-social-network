import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Render,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { NotiManagementService } from './noti-management.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';

@Controller('noti-management')
@UseGuards(ModeratorsAuthGuard)
export class NotiManagementController {
  constructor(private readonly notiManagementService: NotiManagementService) {}

  @Get()
  @Render('admins/pages/notification/index.njk')
  @UseFilters(WebExceptionFilter)
  async getNotiManagement() {
    try {
      return {
        title: 'Quản lý thông báo',
        content: 'admins/pages/notification/index.njk',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('create')
  async createSystemNotification(@Body() dto: CreateSystemNotificationDto) {
    try {
      return await this.notiManagementService.createSystemNotification(dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
