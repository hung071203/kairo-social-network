import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User, UserSchema } from 'src/schemas/users.schema';
import { Post, PostSchema } from 'src/schemas/posts.schema';
import { Report, ReportSchema } from 'src/schemas/reports.schema';
import { Comment, CommentSchema } from 'src/schemas/comments.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
