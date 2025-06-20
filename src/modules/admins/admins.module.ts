import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';
import { PostManagementModule } from './post-management/post-management.module';
import { ProfileModule } from './profile/profile.module';
import { TagManagementModule } from './tag-management/tag-management.module';

@Module({
  imports: [DashboardModule, UserManagementModule, PostManagementModule, ProfileModule, TagManagementModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AdminsModule {}
