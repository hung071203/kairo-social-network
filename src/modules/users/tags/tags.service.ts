import { Inject, Injectable } from '@nestjs/common';
import { TagRepositoryInterface } from 'src/database/interface/tag.interface';

@Injectable()
export class TagsService {
  constructor(
    @Inject('TagRepositoryInterface')
    private readonly tagRepository: TagRepositoryInterface,
  ) {}

  getRepository() {
    return this.tagRepository;
  }

  createTags(tags: string[]) {
    return Promise.all(
      tags.map(async (tag) => {
        const existingTag = await this.tagRepository.findOne({ name: tag });
        if (existingTag) {
          await this.tagRepository.update(existingTag._id as string, {
            postCount: existingTag.postCount + 1,
          });

          return existingTag._id;
        }
        const newTag = await this.tagRepository.create({ name: tag });
        return newTag._id;
      }),
    );
  }

  // Giảm postCount khi xóa post
  async decrementTagsPostCount(tagIds: string[]) {
    if (!tagIds || tagIds.length === 0) return;

    return Promise.all(
      tagIds.map(async (tagId) => {
        const tag = await this.tagRepository.findOneById(tagId);
        if (tag && tag.postCount > 0) {
          await this.tagRepository.update(tagId, {
            postCount: tag.postCount - 1,
          });
        }
      }),
    );
  }
}
