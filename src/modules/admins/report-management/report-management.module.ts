import { Module } from '@nestjs/common';
import { ReportManagementService } from './report-management.service';
import { ReportManagementController } from './report-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from 'src/schemas/reports.schema';
import { ReportRepository } from 'src/database/repository/report.repository';
import { User, UserSchema } from 'src/schemas/users.schema';
import { Post, PostSchema } from 'src/schemas/posts.schema';
import { UserRepository } from 'src/database/repository/user.repository';
import { PostRepository } from 'src/database/repository/post.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Report.name,
        schema: ReportSchema,
      },
    ]),
  ],
  controllers: [ReportManagementController],
  providers: [
    ReportManagementService,
    {
      provide: 'ReportRepositoryInterface',
      useClass: ReportRepository,
    }
  ],
})
export class ReportManagementModule {}
