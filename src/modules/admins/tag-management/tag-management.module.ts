import { Module } from '@nestjs/common';
import { TagManagementService } from './tag-management.service';
import { TagManagementController } from './tag-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from 'src/schemas/tags.chema';
import { TagRepository } from 'src/database/repository/tag.repository';

@Module({
  imports: [MongooseModule.forFeature([{
    name: Tag.name,
    schema: TagSchema,
  }])],
  controllers: [TagManagementController],
  providers: [TagManagementService,
    {
      provide: 'TagRepositoryInterface',
      useClass: TagRepository
    }
  ],
})
export class TagManagementModule {}
