import { Module } from '@nestjs/common';
import { UserManagementService } from './user-management.service';
import { UserManagementController } from './user-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/users.schema';
import { UserRepository } from 'src/database/repository/user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ], // Add your Mongoose models here if needed
  controllers: [UserManagementController],
  providers: [UserManagementService, {
    provide: 'UserRepositoryInterface',
    useClass: UserRepository, // Assuming you have a service class for UserManagementq
  }],
})
export class UserManagementModule {}
