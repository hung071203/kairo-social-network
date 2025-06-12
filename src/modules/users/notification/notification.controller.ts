import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { GetUser, Pagination, PaginationDto } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';
import { FilterNotiDto } from './dto/noti.dto';

@Controller('notification')
@UseGuards(UsersAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @GetUser() user: User, // Assuming user is an object with userId
    @Query() dto: FilterNotiDto,
    @Pagination() pagination: PaginationDto,
  ) {
    return this.notificationService.getNotifications(
      user._id as string,
      dto,
      pagination,
    );
  }

  @Get('unread')
  async getUnreadNotifications(@GetUser() user: User) {
    try {
      return await this.notificationService.getUnreadNotificationCount(
        user._id as string,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/read')
  async markAsRead(@GetUser() user: User, @Param('id') id: string) {
    try {
      return await this.notificationService.markAsRead(user._id as string, id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('mark-all-read')
  async markAllAsRead(@GetUser() user: User) {
    try {
      return await this.notificationService.markAllAsRead(user._id as string);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  async deleteNotification(@GetUser() user: User, @Param('id') id: string) {
    try {
      return await this.notificationService.deleteNotification(
        user._id as string,
        id,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
