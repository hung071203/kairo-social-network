import {
  BadRequestException,
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
import { FollowService } from './follow.service';
import { AllExceptionsFilter, WebExceptionFilter } from 'src/common/filters';
import { UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { GetUser, Pagination, PaginationDto } from 'src/common/decorators';
import { FilterFollowDto } from './dto/follow.dto';
import { User } from 'src/schemas/users.schema';

@Controller('follow')
@UseFilters(WebExceptionFilter)
@UseGuards(UsersAuthGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Get()
  @UseFilters(WebExceptionFilter)
@Render('users/pages/users/follower.njk')
  async getHome() {
    return {
      title: 'Theo dõi',
      content: 'home/index',
      data: {},
    };
  }

  @Get('following')
  @UseFilters(AllExceptionsFilter)
  async getFollowing(
    @GetUser() user: User,
    @Query() dto: FilterFollowDto,
    @Pagination() Pagination: PaginationDto,
  ) {
    try {
      return await this.followService.getFollowing(user._id.toString(), dto, Pagination);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('send/:id')
  @UseFilters(AllExceptionsFilter)
  async followUser(
    @GetUser() user: User,
    @Param('id') id: string,
  ) {
    try {
      return await this.followService.followUser(user._id.toString(), id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('acp/:id')
  @UseFilters(AllExceptionsFilter)
  async acceptFollowRequest(
    @GetUser() user: User,
    @Param('id') id: string,
  ) {
    try {
      return await this.followService.acceptFollowRequest(user._id.toString(), id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('cancel/:id')
  @UseFilters(AllExceptionsFilter)
  async cancelFollowRequest(
    @GetUser() user: User,
    @Param('id') id: string,
  ) {
    try {
      return await this.followService.cancelFollowRequest(user._id.toString(), id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('send1/:requesterId/:targetId')
  @UseFilters(AllExceptionsFilter)
  async followUser11(
    @GetUser() user: User,
    @Param('requesterId') id: string,
    @Param('targetId') targetId: string,
  ) {
    try {
      return await this.followService.followUser(id, targetId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('block/:id')
  @UseFilters(AllExceptionsFilter)
  async blockUser(
    @GetUser() user: User,
    @Param('id') id: string,
  ) {
    try {
      return await this.followService.blockUser(user._id.toString(), id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('unblock/:id')
  @UseFilters(AllExceptionsFilter)
  async unblockUser(
    @GetUser() user: User,
    @Param('id') id: string,
  ) {
    try {
      return await this.followService.unblockUser(user._id.toString(), id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  
}
