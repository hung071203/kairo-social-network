import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { TagRepositoryInterface } from '../interface/tag.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Tag } from 'src/schemas/tags.chema';

@Injectable()
export class TagRepository
  extends BaseRepository<Tag>
  implements TagRepositoryInterface
{
  constructor(
    @InjectModel(Tag.name)
    private readonly tagRepository: PaginateModel<Tag>,
  ) {
    super(tagRepository);
  }
}
