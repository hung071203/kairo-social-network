import { Controller, Get, Query, Render, UseFilters, UseGuards } from '@nestjs/common';
import { TagManagementService } from './tag-management.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { WebExceptionFilter } from 'src/common/filters';
import { Pagination, PaginationDto } from 'src/common/decorators';
import { FilterTagManagementDto } from './dto/tag.dto';

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
      return {
        title: 'Quản lý thẻ',
        content: 'admins/pages/tags/index.njk',
        tags,
        query, // Pass query params to template for sorting
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
