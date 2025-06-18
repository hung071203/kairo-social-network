import { Controller, Get, Render, UseFilters, UseGuards } from '@nestjs/common';
import { HomeService } from './home.service';
import { WebExceptionFilter } from 'src/common/filters';
import { UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { GetUser } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';

@Controller('home')
@UseFilters(WebExceptionFilter)
@UseGuards(UsersAuthGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @Render('users/pages/index')
  async getHome(@GetUser() user: User) {
    return {
      title: 'Home',
      content: 'home/index',
      data: {},
    };
  }

  @Get('search')
  @Render('users/pages/search/search.njk')
  async getSearch(@GetUser() user: User) {
    return {
      title: 'Tìm kiếm',
      content: 'users/pages/search/search.njk',
      data: {},
    };
  }
}
