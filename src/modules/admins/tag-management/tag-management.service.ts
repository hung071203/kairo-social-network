import { Inject, Injectable } from '@nestjs/common';
import { TagRepositoryInterface } from 'src/database/interface/tag.interface';
import { FilterTagManagementDto } from './dto/tag.dto';
import { PaginationDto } from 'src/common/decorators';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class TagManagementService {
  constructor(
    @Inject('TagRepositoryInterface')
    private readonly tagRepository: TagRepositoryInterface,
  ) {}

  async getAllTags(dto: FilterTagManagementDto, pagination: PaginationDto) {
    const form: any = {};

    if (dto.search && dto.search.trim()) {
      const searchTerm = dto.search.trim();

      // Nếu là ObjectId hợp lệ → tìm chính xác theo _id
      if (isValidObjectId(searchTerm)) {
        form._id = searchTerm;
      } else {
        // Escape special regex characters
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        form.$or = [{ name: { $regex: escapedSearch, $options: 'i' } }];
      }
    }

    // Add population for author information
    const options = {
      ...pagination,
    };

    const result = await this.tagRepository.findAll(form, options);

    return result;
  }
}
