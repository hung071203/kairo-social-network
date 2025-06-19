import { Module } from '@nestjs/common';
import { PostManagementService } from './post-management.service';
import { PostManagementController } from './post-management.controller';

@Module({
  controllers: [PostManagementController],
  providers: [PostManagementService],
})
export class PostManagementModule {}
