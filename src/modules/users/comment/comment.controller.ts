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
import { UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { CreateCommentDto } from './dto/comment.dto';
import { GetUser, Pagination, PaginationDto } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';

@Controller('comment')
@UseGuards(UsersAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('create/:id')
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @GetUser() user: User,
  ) {
    try {
      return await this.commentService.createComment(
        user._id as string,
        id,
        dto,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('post/:id')
  async getComments(@Param('id') id: string, @Query() dto: PaginationDto, @Pagination() pagination: PaginationDto) {
    try {
      return await this.commentService.getComments(id, pagination);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
