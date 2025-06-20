import { Controller, Get, Query, Render, UseFilters, UseGuards, Param, Delete, Post, Body } from '@nestjs/common';
import { PostManagementService } from './post-management.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';
import { Pagination, PaginationDto } from 'src/common/decorators';
import { FilterPostManagementDto } from './dto/post.dto';

@Controller('post-management')
@UseGuards(ModeratorsAuthGuard)
export class PostManagementController {
  constructor(private readonly postManagementService: PostManagementService) {}
  
  @Get()
  @Render('admins/pages/posts/index.njk')
  @UseFilters(WebExceptionFilter)
  async getPostManagement(
    @Query() query: FilterPostManagementDto,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      const data = await this.postManagementService.getPosts(query, pagination);
      return {
        title: 'Quản lý bài viết',
        content: 'admins/pages/posts/index.njk',
        data,
        query, // Pass query params to template for sorting
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  @Get('detail/:id')
  async getPostDetail(@Param('id') id: string) {
    try {
      const post = await this.postManagementService.getPostById(id);
      return {
        success: true,
        data: post,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('media/:id')
  async getPostMedia(@Param('id') id: string) {
    try {
      const post = await this.postManagementService.getPostById(id);
      return {
        success: true,
        data: post.mediaUrls,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  @Get('comments/:id')
  async getPostComments(
    @Param('id') id: string,
    @Query() query: any,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      const comments = await this.postManagementService.getPostComments(id, pagination);
      return comments
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Delete('delete/:id')
  async deletePost(@Param('id') id: string) {
    try {
      await this.postManagementService.deletePost(id);
      return {
        success: true,
        message: 'Xóa bài viết thành công',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post('report/:id')
  async reportPost(
    @Param('id') id: string,
    @Body() reportData: { reason: string; description?: string },
  ) {
    try {
      await this.postManagementService.reportPost(id, reportData);
      return {
        success: true,
        message: 'Báo cáo đã được gửi thành công',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
