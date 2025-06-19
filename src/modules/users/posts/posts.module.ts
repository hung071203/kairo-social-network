import { Global, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/schemas/posts.schema';
import { PostRepository } from 'src/database/repository/post.repository';
import { StorageModule } from '../storage/storage.module';
import { TagsModule } from '../tags/tags.module';
import { ProfileModule } from '../profile/profile.module';
import { FollowModule } from '../follow/follow.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    StorageModule,
    TagsModule,
    ProfileModule,
    FollowModule,
  ], // Add your Mongoose models here
  controllers: [PostsController],
  providers: [
    PostsService,
    {
      provide: 'PostRepositoryInterface',
      useClass: PostRepository,
    },
  ],
  exports: [PostsService]
})
export class PostsModule {}
