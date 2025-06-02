import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Render,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreatePostDto, FilterPostDto, SearchPostDto } from './dto/post.dto';
import { GetUser, Pagination, PaginationDto } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';
import { AllExceptionsFilter, WebExceptionFilter } from 'src/common/filters';
import { PostTypeEnum } from 'src/common/enums';

@Controller('posts')
@UseGuards(UsersAuthGuard)
@UseFilters(WebExceptionFilter)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'video', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 100 * 1024 * 1024, // 100MB
        },
      },
    ),
  )
  @Post()
  @UseFilters(AllExceptionsFilter)
  async createPost(
    @Body() body: CreatePostDto,
    @GetUser() user: User,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    try {
      return await this.postsService.createPost(
        user._id as string,
        body,
        files,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('')
  @UseFilters(AllExceptionsFilter)
  async getPosts(
    @GetUser() user: User,
    @Query() dto: FilterPostDto,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      return await this.postsService.getPosts(user._id as string, dto, pagination);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('like/:id')
  @UseFilters(AllExceptionsFilter)
  async likePost(@GetUser() user: User, @Param('id') id: string) {
    try {
      return await this.postsService.likePost(user._id as string, id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('detail/:id')
  @Render('users/pages/posts/detail')
  async getPostDetail(@GetUser() user: User, @Param('id') id: string) {
    try {
      const data = await this.postsService.getPostDetail(
        user._id as string,
        id,
      );
      return { ...data };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('update-type/:id')
  @UseFilters(AllExceptionsFilter)
  async updateTypePost(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('type') type: PostTypeEnum,
  ) {
    try {
      return await this.postsService.updateTypePost(user._id as string, id, type);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @UseFilters(AllExceptionsFilter)
  async deletePost(@GetUser() user: User, @Param('id') id: string) {
    try {
      return await this.postsService.deletePost(user._id as string, id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('search')
  @UseFilters(AllExceptionsFilter)
  async searchPost(
    @GetUser() user: User,
    @Query() dto: SearchPostDto,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      return await this.postsService.searchPost(
        user._id as string,
        dto.search,
        pagination,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

}
