import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Render,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { NotiManagementService } from './noti-management.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';
import { CreateSystemNotificationDto } from './dto/system-notification.dto';
import { Pagination, PaginationDto } from 'src/common/decorators';

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

  @Get('system-notifications')
  async getSystemNotifications(
    @Query() dto: PaginationDto,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      return await this.notiManagementService.getSystemNotifications(pagination);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('system-notifications/:id')
  async deleteSystemNotification(@Param('id') id: string) {
    try {
      return await this.notiManagementService.deleteSystemNotification(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
