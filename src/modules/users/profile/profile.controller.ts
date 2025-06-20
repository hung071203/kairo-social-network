import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Render,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AllGuard, UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { GetUser, Pagination, PaginationDto } from 'src/common/decorators';
import {
  ChangeMailDto,
  SearchUserDto,
  UpdatePassDto,
  UpdateUserDto,
} from './dto/user.dto';
import { User } from 'src/schemas/users.schema';
import { WebExceptionFilter } from 'src/common/filters';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('search')
  @UseGuards(UsersAuthGuard)
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

  @Get('me')
  async getMyProfile(@GetUser() user: User) {
    return user;
  }

  @Get('user/:username')
  @UseFilters(WebExceptionFilter)
  @UseGuards(UsersAuthGuard)
  @Render('users/pages/users/profile.njk')
  async getProfile(@Param('username') username: string, @GetUser() user: User) {
    try {
      const {
        user: target,
        follows,
        isThisAccount,
      } = await this.profileService.getProfile(user._id as string, username);

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

  @Get('settings')
  @UseFilters(WebExceptionFilter)
  @UseGuards(UsersAuthGuard)
  @Render('users/pages/users/settings.njk')
  async getSettings() {
    try {
      return {
        title: 'Cài đặt tài khoản',
        content: 'users/pages/users/settings.njk',
        capchaPublicKey: process.env.CAPTCHA_PUBLIC_KEY,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('update')
  @UseGuards(AllGuard)
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

  @Post('change-password')
  @UseGuards(AllGuard)
  async updatePassword(
    @GetUser() user: User,
    @Body() dto: UpdatePassDto, // Replace with actual DTO
  ) {
    try {
      return await this.profileService.updatePassword(user._id as string, dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('unlink-google')
  @UseGuards(UsersAuthGuard)
  async unlinkGoogle(@GetUser() user: User) {
    try {
      return await this.profileService.unlinkGoogle(user._id as string);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  
  @Post('check-username')
  async checkUsername(@Body('username') username: string) {
    try {
      return await this.profileService.checkUsername(username);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('update-username')
  @UseGuards(AllGuard)
  async updateUsername(
    @GetUser() user: User,
    @Body('username') username: string,
  ) {
    try {
      return await this.profileService.updateUsername(
        user._id as string,
        username,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('change-mail')
  @UseGuards(AllGuard)
  async changeMail(@GetUser() user: User, @Body() dto: ChangeMailDto) {
    try {
      return await this.profileService.changeMail(user._id as string, dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
