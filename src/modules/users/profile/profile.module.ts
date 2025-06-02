import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/users.schema';
import { UserRepository } from 'src/database/repository/user.repository';
import {
  FollowInteraction,
  FollowInteractionSchema,
} from 'src/schemas/followInteractions.chema';
import { FollowInteractionRepository } from 'src/database/repository/followInteraction.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: FollowInteraction.name, schema: FollowInteractionSchema },
    ]),
  ], // Add your Mongoose models here
  controllers: [ProfileController],
  providers: [
    ProfileService,
    {
      provide: 'UserRepositoryInterface',
      useClass: UserRepository,
    },
    {
      provide: 'FollowInteractionRepositoryInterface',
      useClass: FollowInteractionRepository, // Assuming you have a repository for FollowInteraction
    }
  ],
  exports: [ProfileService],
})
export class ProfileModule {}
