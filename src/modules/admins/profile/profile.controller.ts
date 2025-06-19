import { Controller, Get, Render, UseFilters, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';
import { GetUser } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';

@Controller('profile')
@UseGuards(ModeratorsAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @Render('admins/pages/users/edit-profile.njk')
  @UseFilters(WebExceptionFilter)
  async getProfile(@GetUser() user: User) {
    return {
      title: 'Chỉnh sửa thông tin cá nhân',
      content: 'admins/pages/users/edit-profile.njk',
      capchaPublicKey: process.env.CAPTCHA_PUBLIC_KEY, // Thêm khóa công khai CAPTCHA nếu cần
      user, // Truyền thông tin người dùng hiện tại vào template
    }
  }
}
