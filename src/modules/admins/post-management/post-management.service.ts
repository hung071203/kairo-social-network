import { Inject, Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/common/decorators';
import { PostRepositoryInterface } from 'src/database/interface/post.interface';
import { FilterPostManagementDto } from './dto/post.dto';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class PostManagementService {
  constructor(
    @Inject('PostRepositoryInterface')
    private readonly postRepository: PostRepositoryInterface,
  ) {}

  async getPosts(dto: FilterPostManagementDto, pagination: PaginationDto) {
    const form: any = {};

    if (dto.search && dto.search.trim()) {
      const searchTerm = dto.search.trim();

      // Nếu là ObjectId hợp lệ → tìm chính xác theo _id
      if (isValidObjectId(searchTerm)) {
        form._id = searchTerm;
        console.log('Searching by ObjectId');
      } else {
        // Escape special regex characters
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        form.$or = [{ content: { $regex: escapedSearch, $options: 'i' } }];
      }
    }

    const result = await this.postRepository.findAll(form, pagination);

    return result;
  }
}
