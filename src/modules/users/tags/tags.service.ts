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
}
