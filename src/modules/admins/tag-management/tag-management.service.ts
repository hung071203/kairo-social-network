import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TagRepositoryInterface } from 'src/database/interface/tag.interface';
import { PostRepositoryInterface } from 'src/database/interface/post.interface';
import { FilterTagManagementDto, UpdateTagDto } from './dto/tag.dto';
import { PaginationDto } from 'src/common/decorators';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class TagManagementService {
  constructor(
    @Inject('TagRepositoryInterface')
    private readonly tagRepository: TagRepositoryInterface,
    @Inject('PostRepositoryInterface')
    private readonly postRepository: PostRepositoryInterface,
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
  async getTagById(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID thẻ không hợp lệ');
    }

    const tag = await this.tagRepository.findOneById(id);
    if (!tag) {
      throw new NotFoundException('Không tìm thấy thẻ');
    }

    return tag;
  }

  async updateTag(id: string, updateTagDto: UpdateTagDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID thẻ không hợp lệ');
    }

    // Check if tag exists
    const existingTag = await this.tagRepository.findOneById(id);
    if (!existingTag) {
      throw new NotFoundException('Không tìm thấy thẻ');
    }

    // Check if name already exists (excluding current tag)
    if (updateTagDto.name && updateTagDto.name !== existingTag.name) {
      const nameExists = await this.tagRepository.findOne({ 
        name: updateTagDto.name,
        _id: { $ne: id }
      });
      if (nameExists) {
        throw new BadRequestException('Tên thẻ đã tồn tại');
      }
    }

    const updatedTag = await this.tagRepository.update(id, updateTagDto);
    return updatedTag;
  }

  async deleteTag(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID thẻ không hợp lệ');
    }

    const tag = await this.tagRepository.findOneById(id);
    if (!tag) {
      throw new NotFoundException('Không tìm thấy thẻ');
    }

    // Remove tag from all posts that use it
    const postModel = this.postRepository.getModel();
    await postModel.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );

    // Delete the tag
    await this.tagRepository.delete(id);
  }

  async getPostsByTag(tagId: string) {
    if (!isValidObjectId(tagId)) {
      throw new BadRequestException('ID thẻ không hợp lệ');
    }

    const tag = await this.tagRepository.findOneById(tagId);
    if (!tag) {
      throw new NotFoundException('Không tìm thấy thẻ');
    }

    const posts = await this.postRepository.findAll(
      { tags: tagId },
      {
        populate: [
          {
            path: 'author',
            select: 'name username avatar'
          }
        ],
        sort: { createdAt: -1 },
        limit: 50 // Limit to 50 posts for performance
      }
    );

    return posts;
  }
}
