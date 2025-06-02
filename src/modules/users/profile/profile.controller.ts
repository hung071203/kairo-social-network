import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Render,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { GetUser, Pagination, PaginationDto } from 'src/common/decorators';
import { SearchUserDto, UpdateUserDto } from './dto/user.dto';
import { User } from 'src/schemas/users.schema';
import { WebExceptionFilter } from 'src/common/filters';

@Controller('profile')
@UseGuards(UsersAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('search')
  async searchUser(
    @GetUser() user: User,
    @Query() dto: SearchUserDto,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      return await this.profileService.searchUser(
        user._id as string,
        dto.search,
        pagination,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('user/:username')
  @UseFilters(WebExceptionFilter)
  @Render('users/pages/users/profile.njk')
  async getProfile(@Param('username') username: string, @GetUser() user: User) {
    try {
      const {user: target, follows, isThisAccount} = await this.profileService.getProfile(user._id as string, username);

      return {
        title: 'Trang cá nhân' + target.name,
        content: 'users/pages/users/profile.njk',
        target,
        follows,
        isThisAccount,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('update')
  async updateProfile(
    @GetUser() user: User,
    @Body() dto: UpdateUserDto, // Replace with actual DTO
  ) {
    try {
      return await this.profileService.updateProfile(user._id as string, dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
