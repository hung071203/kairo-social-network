import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Render,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';
import { Pagination, PaginationDto } from 'src/common/decorators';
import { FilterUserDto, CreateUserDto, UpdateUserDto, BanUserDto } from './dto/user-manager.dto';

@Controller('user-management')
@UseGuards(ModeratorsAuthGuard)
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}
  @Get()
  @Render('admins/pages/users/index.njk')
  @UseFilters(WebExceptionFilter)
  async getUserManagement(
    @Query() dto: FilterUserDto,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      const data = await this.userManagementService.getUsers(dto, pagination);
      return {
        title: 'Quản lý người dùng',
        content: 'admins/pages/users/index.njk',
        data,
        query: dto, // Pass query params to template for sorting
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('create')
  @UseFilters(WebExceptionFilter)
  async createUser(@Body() dto: CreateUserDto) {
    try {
      const user = await this.userManagementService.createUser(dto);
      return {
        message: 'Tạo người dùng thành công',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('get/:id')
  @UseFilters(WebExceptionFilter)
  async getUser(@Param('id') id: string) {
    try {
      const user = await this.userManagementService.getUserById(id);
      return {
        message: 'Lấy thông tin người dùng thành công',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('update/:id')
  @UseFilters(WebExceptionFilter)
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    try {
      const user = await this.userManagementService.updateUser(id, dto);
      return {
        message: 'Cập nhật người dùng thành công',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('ban/:id')
  @UseFilters(WebExceptionFilter)
  async banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    try {
      const user = await this.userManagementService.banUser(id, dto);
      return {
        message: dto.bannedUntil ? 'Khóa người dùng thành công' : 'Mở khóa người dùng thành công',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }  @Post('warn/:id')
  @UseFilters(WebExceptionFilter)
  async warnUser(@Param('id') id: string, @Body() dto: { bannedReason: string }) {
    try {
      const user = await this.userManagementService.warnUser(id, dto.bannedReason);
      return {
        message: 'Cảnh báo người dùng thành công',
        data: user,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('delete/:id')
  @UseFilters(WebExceptionFilter)
  async deleteUser(@Param('id') id: string) {
    try {
      await this.userManagementService.deleteUser(id);
      return {
        message: 'Xóa người dùng thành công',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
