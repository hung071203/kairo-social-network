import { Controller, Get, Query, Render, UseFilters, UseGuards } from '@nestjs/common';
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
}
