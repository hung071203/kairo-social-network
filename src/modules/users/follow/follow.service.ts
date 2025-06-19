import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  FollowInteractionStatusEnum,
  NotificationType,
  UserRole,
} from 'src/common/enums';
import { FollowInteractionRepositoryInterface } from 'src/database/interface/followInteraction.interface';
import { FilterFollowDto } from './dto/follow.dto';
import { PaginationDto } from 'src/common/decorators';
import { ProfileService } from '../profile/profile.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class FollowService {
  constructor(
    @Inject('FollowInteractionRepositoryInterface')
    private readonly followInteractionRepository: FollowInteractionRepositoryInterface,
    private readonly profileService: ProfileService,
    private readonly notificationService: NotificationService, // Assuming you have a NotificationService for notifications
  ) {}

  getRepository() {
    return this.followInteractionRepository;
  }

  async getAllFollowing(id: string) {
    const followings = await this.followInteractionRepository.getModel().find({
      requester: new Types.ObjectId(id),
      status: FollowInteractionStatusEnum.ACCEPTED,
    });
    return followings.map((item) => {
      return item?.target;
    });
  }

  async getAllFollowers(id: string) {
    const followers = await this.followInteractionRepository.getModel().find({
      target: new Types.ObjectId(id),
      status: FollowInteractionStatusEnum.ACCEPTED,
    });
    return followers.map((item) => {
      return item?.requester;
    });
  }

  async getAllBlocked(id: string) {
    const blockedInteractions = await this.followInteractionRepository
      .getModel()
      .find({
        $or: [
          {
            requester: new Types.ObjectId(id),
            status: FollowInteractionStatusEnum.BLOCKED,
          },
          {
            target: new Types.ObjectId(id),
            status: FollowInteractionStatusEnum.BLOCKED,
          },
        ],
      });

    const blockedIds = blockedInteractions.map((item) => {
      return item?.target?.toString() === id ? item.requester : item.target;
    });

    return blockedIds;
  }

  async getFollowing(
    id: string,
    dto: FilterFollowDto,
    pagination: PaginationDto,
  ) {
    const { tab } = dto;
    const form: any = {};
    if (tab == 'incoming-requests') {
      form.status = FollowInteractionStatusEnum.PENDING;
      form.target = new Types.ObjectId(id);
    } else if (tab == 'sent-requests') {
      form.status = FollowInteractionStatusEnum.PENDING;
      form.requester = new Types.ObjectId(id);
    } else if (tab == 'suggestions') {
      return this.suggestions(id, pagination);
    } else if (tab == 'followers') {
      form.status = FollowInteractionStatusEnum.ACCEPTED;
      form.target = new Types.ObjectId(id);
    } else if (tab == 'following') {
      form.status = FollowInteractionStatusEnum.ACCEPTED;
      form.requester = new Types.ObjectId(id);
    } else if (tab == 'blockers') {
      form.status = FollowInteractionStatusEnum.BLOCKED;
      form.requester = new Types.ObjectId(id);
    }

    return this.followInteractionRepository.findAll(form, {
      ...pagination,
      populate: [
        {
          path: 'requester',
          select: '_id name avatar',
        },
        {
          path: 'target',
          select: '_id name avatar',
        },
      ],
    });
  }

  async suggestions(id: string, pagination: PaginationDto) {
    const followings = await this.getAllFollowing(id);
    const followers = await this.getAllFollowers(id);

    const followingIds = followings.map((u) => u.toString());
    const followerIds = followers.map((u) => u.toString());

    // B2. Gộp và loại trùng -> danh sách liên quan
    const relatedIdsSet = new Set([...followingIds, ...followerIds]);
    relatedIdsSet.delete(id); // loại chính mình nếu có
    const relatedIds = Array.from(relatedIdsSet);

    const secondLevelFollows = await this.followInteractionRepository
      .getModel()
      .find({
        $or: [
          {
            requester: { $in: relatedIds.map((id) => new Types.ObjectId(id)) },
          },
          { target: { $in: relatedIds.map((id) => new Types.ObjectId(id)) } },
        ],
        status: FollowInteractionStatusEnum.ACCEPTED,
      });

    const suggestionIdSet = new Set<string>();
    for (const item of secondLevelFollows) {
      const requesterId = item.requester.toString();
      const targetId = item.target.toString();
      if (requesterId !== id && !relatedIds.includes(requesterId))
        suggestionIdSet.add(requesterId);
      if (targetId !== id && !relatedIds.includes(targetId))
        suggestionIdSet.add(targetId);
    }

    return this.profileService.getRepository().findAll(
      {
        _id: {
          $in: Array.from(suggestionIdSet).map((id) => new Types.ObjectId(id)),
        },
        isPrivate: false,
        role: UserRole.USER,
        $or: [{ bannedUntil: null }, { bannedUntil: { $lte: new Date() } }],
      },
      {
        ...pagination,
        select: '_id name username avatar',
      },
    );
  }

  async followUser(requesterId: string, targetId: string) {
    const requester = await this.profileService.getRepository().findOne({
      _id: new Types.ObjectId(requesterId),
      role: UserRole.USER,
    });
    if (!requester) {
      throw new Error('Người dùng không tồn tại');
    }

    const target = await this.profileService.getRepository().findOne({
      _id: new Types.ObjectId(targetId),
      role: UserRole.USER,
    });

    if (!target) {
      throw new Error('Người dùng không tồn tại hoặc tài khoản riêng tư');
    }

    const existingFollow = await this.followInteractionRepository
      .getModel()
      .findOne({
        requester: new Types.ObjectId(requesterId),
        target: new Types.ObjectId(targetId),
      });

    if (existingFollow) {
      if (existingFollow.status !== FollowInteractionStatusEnum.BLOCKED) {
        await this.followInteractionRepository
          .getModel()
          .findByIdAndDelete(existingFollow._id);
        return { message: 'Yêu cầu theo dõi đã hủy thành công' };
      } else {
        throw new Error('Bạn đã bị chặn bởi người dùng này');
      }
    }

    const newFollow = await this.followInteractionRepository.create({
      requester: new Types.ObjectId(requesterId),
      target: new Types.ObjectId(targetId),
      status: target.isPrivate
        ? FollowInteractionStatusEnum.PENDING
        : FollowInteractionStatusEnum.ACCEPTED,
    });

    await this.notificationService.create(targetId, {
      title: target.isPrivate ? 'Yêu cầu theo dõi mới' : 'Theo dõi mới',
      type: NotificationType.FOLLOW,
      message: target.isPrivate
        ? `${requester.name} đã gửi yêu cầu theo dõi bạn`
        : `${requester.name} đã theo dõi bạn`,
      redirectUrl: `/profile/user/${requester._id}`,
    });

    return {
      message: target.isPrivate
        ? 'Yêu cầu theo dõi đã được gửi thành công'
        : 'Đã theo dõi thành công',
      followId: newFollow._id,
    };
  }

  async acceptFollowRequest(userId: string, requesterId: string) {
    const followRequest = await this.followInteractionRepository
      .getModel()
      .findOne({
        requester: new Types.ObjectId(requesterId),
        target: new Types.ObjectId(userId),
        status: FollowInteractionStatusEnum.PENDING,
      });

    if (!followRequest) {
      throw new Error('Yêu cầu theo dõi không tồn tại hoặc đã được xử lý');
    }

    followRequest.status = FollowInteractionStatusEnum.ACCEPTED;
    await followRequest.save();

    return { message: 'Yêu cầu theo dõi đã được chấp nhận' };
  }

  async cancelFollowRequest(userId: string, requesterId: string) {
    const followRequest = await this.followInteractionRepository
      .getModel()
      .findOne({
        requester: new Types.ObjectId(requesterId),
        target: new Types.ObjectId(userId),
      });

    if (
      !followRequest ||
      followRequest.status == FollowInteractionStatusEnum.BLOCKED
    ) {
      throw new Error('Yêu cầu theo dõi không tồn tại hoặc đã được xử lý');
    }

    await this.followInteractionRepository
      .getModel()
      .findByIdAndDelete(followRequest._id);

    return { message: 'Yêu cầu theo dõi đã bị hủy' };
  }

  async blockUser(userId: string, targetId: string) {
    const user = await this.profileService.getRepository().findOne({
      _id: new Types.ObjectId(userId),
      role: UserRole.USER,
    });
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const target = await this.profileService.getRepository().findOne({
      _id: new Types.ObjectId(targetId),
      role: UserRole.USER,
    });

    if (!target) {
      throw new Error('Người dùng không tồn tại hoặc tài khoản riêng tư');
    }

    const existingBlock = await this.followInteractionRepository
      .getModel()
      .findOne({
        $or: [
          {
            requester: new Types.ObjectId(userId),
            target: new Types.ObjectId(targetId),
          },
          {
            requester: new Types.ObjectId(targetId),
            target: new Types.ObjectId(userId),
          },
        ],
        status: FollowInteractionStatusEnum.BLOCKED,
      });

    if (existingBlock) {
      throw new Error('Không thể thực hiện hành động!');
    }

    await this.followInteractionRepository.getModel().deleteMany({
      $or: [
        {
          requester: new Types.ObjectId(userId),
          target: new Types.ObjectId(targetId),
        },
        {
          requester: new Types.ObjectId(targetId),
          target: new Types.ObjectId(userId),
        },
      ],
    });

    return this.followInteractionRepository.create({
      requester: new Types.ObjectId(userId),
      target: new Types.ObjectId(targetId),
      status: FollowInteractionStatusEnum.BLOCKED,
    });
  }

  async unblockUser(userId: string, targetId: string) {
    const user = await this.profileService.getRepository().findOne({
      _id: new Types.ObjectId(userId),
      role: UserRole.USER,
    });
    if (!user) {
      throw new Error('Người dùng không tồn tại');
    }

    const target = await this.profileService.getRepository().findOne({
      _id: new Types.ObjectId(targetId),
      role: UserRole.USER,
    });

    if (!target) {
      throw new Error('Người dùng không tồn tại hoặc tài khoản riêng tư');
    }

    const existingBlock = await this.followInteractionRepository
      .getModel()
      .findOne({
        requester: new Types.ObjectId(userId),
        target: new Types.ObjectId(targetId),
        status: FollowInteractionStatusEnum.BLOCKED,
      });

    if (!existingBlock) {
      throw new Error('Không có người dùng nào bị chặn');
    }

    return this.followInteractionRepository.getModel().findByIdAndDelete(existingBlock._id);
  }
}
