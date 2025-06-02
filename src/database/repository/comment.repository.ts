import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Comment } from 'src/schemas/comments.schema';
import { CommentRepositoryInterface } from '../interface/comment.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class CommentRepository
  extends BaseRepository<Comment>
  implements CommentRepositoryInterface
{
  constructor(
    @InjectModel(Comment.name)
    private readonly commentRepository: PaginateModel<Comment>,
  ) {
    super(commentRepository);
  }
}
