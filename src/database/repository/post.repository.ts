import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Post } from 'src/schemas/posts.schema';
import { PostRepositoryInterface } from '../interface/post.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PostRepository
  extends BaseRepository<Post>
  implements PostRepositoryInterface
{
  constructor(
    @InjectModel(Post.name)
    private readonly postRepository: PaginateModel<Post>,
  ) {
    super(postRepository);
  }
}
