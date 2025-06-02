import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { User } from 'src/schemas/users.schema';
import { UserRepositoryInterface } from '../interface/user.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserRepository
  extends BaseRepository<User>
  implements UserRepositoryInterface
{
  constructor(
    @InjectModel(User.name)
    private readonly userRepository: PaginateModel<User>,
  ) {
    super(userRepository);
  }
}
