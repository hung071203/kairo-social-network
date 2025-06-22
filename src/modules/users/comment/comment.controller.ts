import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { AllGuard, UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { CreateCommentDto } from './dto/comment.dto';
import { GetUser, Pagination, PaginationDto } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('create/:id')
  @UseGuards(UsersAuthGuard)
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @GetUser() user: User,
  ) {
    try {
      return await this.commentService.createComment(
        user._id.toString(),
        id,
        dto,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('post/:id')
  @UseGuards(AllGuard)
  async getComments(
    @Param('id') id: string,
    @Query() dto: PaginationDto,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      return await this.commentService.getComments(id, pagination);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
