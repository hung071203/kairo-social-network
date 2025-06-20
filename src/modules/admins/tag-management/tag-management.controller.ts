import { BadRequestException, Controller, Get, Query, Render, UseFilters, UseGuards, Param, Put, Delete, Body } from '@nestjs/common';
import { TagManagementService } from './tag-management.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';
import { Pagination, PaginationDto } from 'src/common/decorators';
import { FilterTagManagementDto, UpdateTagDto } from './dto/tag.dto';

@Controller('tag-management')
@UseGuards(ModeratorsAuthGuard)
export class TagManagementController {
  constructor(private readonly tagManagementService: TagManagementService) {}

  @Get()
  @Render('admins/pages/tags/index.njk')
  @UseFilters(WebExceptionFilter)
  async getTagManagement(
    @Query() query: FilterTagManagementDto,
    @Pagination() pagination: PaginationDto,
  ) {
    try {
      const tags = await this.tagManagementService.getAllTags(query, pagination);
      console.log('tags', tags);
      
      return {
        title: 'Quản lý thẻ',
        content: 'admins/pages/tags/index.njk',
        tags,
        data: tags,
        query, // Pass query params to template for sorting
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('detail/:id')
  async getTagDetail(@Param('id') id: string) {
    try {
      const tag = await this.tagManagementService.getTagById(id);
      return tag
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi lấy thông tin thẻ'
      };
    }
  }

  @Put('update/:id')
  async updateTag(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    try {
      const updatedTag = await this.tagManagementService.updateTag(id, updateTagDto);
      return {
        success: true,
        data: updatedTag,
        message: 'Cập nhật thẻ thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi cập nhật thẻ'
      };
    }
  }

  @Delete('delete/:id')
  async deleteTag(@Param('id') id: string) {
    try {
      await this.tagManagementService.deleteTag(id);
      return {
        success: true,
        message: 'Xóa thẻ thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi xóa thẻ'
      };
    }
  }

  @Get('posts/:id')
  async getTagPosts(@Param('id') id: string) {
    try {
      const posts = await this.tagManagementService.getPostsByTag(id);
      return {
        success: true,
        data: posts,
        message: 'Lấy danh sách bài viết thành công'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi lấy danh sách bài viết'
      };
    }
  }
}
