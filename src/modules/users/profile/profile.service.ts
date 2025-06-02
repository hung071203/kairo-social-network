import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PaginationDto } from 'src/common/decorators';
import { FollowInteractionStatusEnum, UserRole } from 'src/common/enums';
import { UserRepositoryInterface } from 'src/database/interface/user.interface';
import { FollowService } from '../follow/follow.service';
import { FollowInteractionRepositoryInterface } from 'src/database/interface/followInteraction.interface';
import { UpdateUserDto } from './dto/user.dto';
import { hashPassword } from 'src/utils';

@Injectable()
export class ProfileService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('FollowInteractionRepositoryInterface')
    private readonly followRepository: FollowInteractionRepositoryInterface,
  ) {}

  getRepository() {
    return this.userRepository;
  }

  async searchUser(id: string, search: string, pagination: PaginationDto) {
    const searchConditions = [
      { username: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const form: any = {
      $and: [
        { $or: searchConditions },
        { _id: { $ne: new Types.ObjectId(id) } },
        { isPrivate: false },
        { role: UserRole.USER },
        {
          $or: [{ bannedUntil: null }, { bannedUntil: { $lte: new Date() } }],
        },
      ],
    };

    return this.userRepository.findAll(form, pagination);
  }

  async getProfile(userId: string, username: string) {
    const isObjectId = Types.ObjectId.isValid(username);

    const user = await this.userRepository.findOne({
      ...(isObjectId
        ? { _id: new Types.ObjectId(username) }
        : { username: username }),
    });

    if (!user || user.role !== UserRole.USER) {
      throw new Error('Người dùng không tồn tại');
    }

    let follows = null;
    if (userId != user._id.toString()) {
      follows = await this.followRepository.getModel().find({
        $or: [
          {
            requester: new Types.ObjectId(userId),
            target: user._id,
          },
          {
            requester: user._id,
            target: new Types.ObjectId(userId),
          },
        ],
      });

      const isBlocked = follows.some(f => f.status === FollowInteractionStatusEnum.BLOCKED);

      if (isBlocked) {
        throw new Error('Bạn không có quyền xem trang cá nhân này');
      }
    }
    // console.log(user, follows);
    
    return { user: {...user, ...(user.birthday && {birthday: user.birthday.toISOString().split('T')[0]})}, follows, isThisAccount: userId == user._id.toString() };
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      _id: new Types.ObjectId(userId),
    });
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

      return this.userRepository.update(userId, {...dto,
        ...(dto.password && { password: await hashPassword(dto.password) }),
      })
    }
}
