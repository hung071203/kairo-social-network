import { Module } from '@nestjs/common';
import { PostManagementService } from './post-management.service';
import { PostManagementController } from './post-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/schemas/posts.schema';
import { PostRepository } from 'src/database/repository/post.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema,
      },
    ]),
  ], // Add your Mongoose models here if needed
  controllers: [PostManagementController],
  providers: [
    PostManagementService,
    {
      provide: 'PostRepositoryInterface',
      useClass: PostRepository,
    },
  ],
})
export class PostManagementModule {}
