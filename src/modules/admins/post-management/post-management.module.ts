import { Module } from '@nestjs/common';
import { PostManagementService } from './post-management.service';
import { PostManagementController } from './post-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/schemas/posts.schema';
import { Comment, CommentSchema } from 'src/schemas/comments.schema';
import { Report, ReportSchema } from 'src/schemas/reports.schema';
import { PostRepository } from 'src/database/repository/post.repository';
import { CommentRepository } from 'src/database/repository/comment.repository';
import { ReportRepository } from 'src/database/repository/report.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema,
      },
      {
        name: Comment.name,
        schema: CommentSchema,
      },
      {
        name: Report.name,
        schema: ReportSchema,
      },
    ]),
  ],
  controllers: [PostManagementController],
  providers: [
    PostManagementService,
    {
      provide: 'PostRepositoryInterface',
      useClass: PostRepository,
    },
    {
      provide: 'CommentRepositoryInterface',
      useClass: CommentRepository,
    },
    {
      provide: 'ReportRepositoryInterface',
      useClass: ReportRepository,
    },
  ],
})
export class PostManagementModule {}
