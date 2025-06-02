import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Tag, TagSchema } from 'src/schemas/tags.chema';
import { TagRepository } from 'src/database/repository/tag.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }])],
  providers: [
    TagsService,
    {
      provide: 'TagRepositoryInterface',
      useClass: TagRepository,
    },
  ],
  exports: [
    TagsService,
  ],
})
export class TagsModule {}
