import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Comment as Comments,
  CommentSchema,
} from 'src/schemas/comments.schema';
import { CommentRepository } from 'src/database/repository/comment.repository';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comments.name, schema: CommentSchema }]),
    PostsModule
  ],
  controllers: [CommentController],
  providers: [
    CommentService,
    {
      provide: 'CommentRepositoryInterface',
      useClass: CommentRepository,
    },
  ],
})
export class CommentModule {}
