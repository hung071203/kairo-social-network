import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';

@Module({
  imports: [DashboardModule, UserManagementModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AdminsModule {}
