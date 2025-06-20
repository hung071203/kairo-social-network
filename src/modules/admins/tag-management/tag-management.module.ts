import { Module } from '@nestjs/common';
import { TagManagementService } from './tag-management.service';
import { TagManagementController } from './tag-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from 'src/schemas/tags.chema';
import { Post, PostSchema } from 'src/schemas/posts.schema';
import { TagRepository } from 'src/database/repository/tag.repository';
import { PostRepository } from 'src/database/repository/post.repository';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: Tag.name,
      schema: TagSchema,
    },
    {
      name: Post.name,
      schema: PostSchema,
    }
  ])],
  controllers: [TagManagementController],
  providers: [TagManagementService,
    {
      provide: 'TagRepositoryInterface',
      useClass: TagRepository
    },
    {
      provide: 'PostRepositoryInterface',
      useClass: PostRepository
    }
  ],
})
export class TagManagementModule {}
