import { forwardRef, Module } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowInteraction, FollowInteractionSchema } from 'src/schemas/followInteractions.chema';
import { FollowInteractionRepository } from 'src/database/repository/followInteraction.repository';
import { UsersModule } from '../users.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [MongooseModule.forFeature([{name: FollowInteraction.name, schema: FollowInteractionSchema}]), forwardRef(() => ProfileModule)], // Add your Mongoose models here
  controllers: [FollowController],
  providers: [FollowService,
    {
      provide: 'FollowInteractionRepositoryInterface',
      useClass: FollowInteractionRepository,
    }
  ],
  exports: [FollowService],
})
export class FollowModule {}
