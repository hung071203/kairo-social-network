import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { ProfileModule } from './profile/profile.module';
import { ChatModule } from './chat/chat.module';
import { HomeModule } from './home/home.module';
import { StorageModule } from './storage/storage.module';
import { TagsModule } from './tags/tags.module';
import { FollowModule } from './follow/follow.module';
import { CommentModule } from './comment/comment.module';
import { ReportModule } from './report/report.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    AuthModule,
    PostsModule,
    ProfileModule,
    ChatModule,
    HomeModule,
    StorageModule,
    TagsModule,
    FollowModule,
    CommentModule,
    ReportModule,
    NotificationModule,
  ],
})
export class UsersModule {}
