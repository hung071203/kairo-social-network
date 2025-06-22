import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserRepositoryInterface } from 'src/database/interface/user.interface';
import {
  FilterUserDto,
  CreateUserDto,
  UpdateUserDto,
  BanUserDto,
} from './dto/user-manager.dto';
import { PaginationDto } from 'src/common/decorators';
import { isValidObjectId } from 'mongoose';
import { hashPassword } from 'src/utils';
import { NotificationService } from 'src/modules/users/notification/notification.service';
import { NotificationType, UserStatusEnum } from 'src/common/enums';
import { FollowService } from 'src/modules/users/follow/follow.service';
import { PostsService } from 'src/modules/users/posts/posts.service';

@Injectable()
export class UserManagementService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private readonly notificationService: NotificationService,
    private readonly followService: FollowService,
    private readonly postsService: PostsService, // Assuming you have a PostService for posts
  ) {}

  getRepository() {
    return this.userRepository;
  }
  async getUsers(dto: FilterUserDto, pagination: PaginationDto) {
    const form: any = {};

    if (dto.search && dto.search.trim()) {
      const searchTerm = dto.search.trim();

      // Nếu là ObjectId hợp lệ → tìm chính xác theo _id
      if (isValidObjectId(searchTerm)) {
        form._id = searchTerm;
        console.log('Searching by ObjectId');
      } else {
        // Escape special regex characters
        const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        form.$or = [
          { username: { $regex: escapedSearch, $options: 'i' } },
          { name: { $regex: escapedSearch, $options: 'i' } },
          { email: { $regex: escapedSearch, $options: 'i' } },
        ];

        // Nếu search term là số điện thoại (chỉ chứa số và có thể có + ở đầu)
        if (/^[\+]?[0-9]+$/.test(searchTerm)) {
          form.$or.push({ phone: { $regex: escapedSearch, $options: 'i' } });
        }
      }
    }

    if (dto.role) {
      form.role = dto.role;
    }

    if (dto.status) {
      const now = new Date();
      switch (dto.status) {
        case UserStatusEnum.BANNED:
          form.bannedUntil = { $gt: now };
          break;

        case UserStatusEnum.ACTIVE:
          form.$and = [
            {
              $or: [
                { bannedUntil: null },
                { bannedUntil: { $lte: now } },
              ],
            },
            { bannedReason: null },
          ];
          break;

        case UserStatusEnum.WARNING:
          form.bannedReason = { $ne: null };
          form.$or = [
            { bannedUntil: null },
            { bannedUntil: { $lte: now } },
          ];
          break;
      }
    }

    const result = await this.userRepository.findAll(form, pagination);

    return result;
  }

  async createUser(dto: CreateUserDto) {
    // Check if username or email already exists
    const existingUser = await this.userRepository.findOne({
      $or: [{ username: dto.username }, { email: dto.email }],
    });

    if (existingUser) {
      throw new ConflictException('Username hoặc email đã tồn tại');
    }

    const hashedPassword = await hashPassword(dto.password);

    const userData = {
      ...dto,
      password: hashedPassword,
    };

    return this.userRepository.create(userData);
  }

  async getUserById(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID người dùng không hợp lệ');
    }

    const user = await this.userRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const followersCount = (await this.followService.getAllFollowers(id))
      .length;
    const followingCount = (await this.followService.getAllFollowing(id))
      .length;
    const postsCount = await this.postsService.getPostCount(id);

    // Don't return password
    const { password, ...userWithoutPassword } = user.toObject();
    return {
      ...userWithoutPassword,
      followersCount,
      followingCount,
      postsCount,
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID người dùng không hợp lệ');
    }

    const user = await this.userRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Check if username or email already exists (excluding current user)
    if (dto.username || dto.email) {
      const conditions = [];
      if (dto.username) conditions.push({ username: dto.username });
      if (dto.email) conditions.push({ email: dto.email });

      const existingUser = await this.userRepository.findOne({
        $and: [{ _id: { $ne: id } }, { $or: conditions }],
      });

      if (existingUser) {
        throw new ConflictException('Username hoặc email đã tồn tại');
      }
    }

    const updateData = { ...dto };

    // Hash password if provided
    if (dto.password) {
      updateData.password = await hashPassword(dto.password);
    }

    return this.userRepository.update(id, updateData);
  }

  async banUser(id: string, dto: BanUserDto) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID người dùng không hợp lệ');
    }

    const user = await this.userRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const updateData: any = {};

    if (dto.bannedUntil) {
      updateData.bannedUntil = new Date(dto.bannedUntil);
      updateData.bannedReason = dto.bannedReason || 'Vi phạm quy định';
    } else {
      updateData.bannedUntil = null;
      updateData.bannedReason = null;
    }

    return this.userRepository.update(id, updateData);
  }

  async warnUser(id: string, reason: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID người dùng không hợp lệ');
    }

    const user = await this.userRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Create notification for user
    await this.notificationService.create(id, {
      title: 'Cảnh báo từ quản trị viên',
      message: `Bạn đã nhận được cảnh báo: ${reason}`,
      type: NotificationType.SYSTEM,
    }); // Update user record with warning
    return this.userRepository.update(id, {
      bannedReason: reason,
      bannedUntil: null, // Warning without ban
    });
  }

  async removeWarning(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID người dùng không hợp lệ');
    }

    const user = await this.userRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Create notification for user
    await this.notificationService.create(id, {
      title: 'Thông báo từ quản trị viên',
      message:
        'Cảnh báo của bạn đã được gỡ bỏ. Tài khoản đã trở về trạng thái bình thường.',
      type: NotificationType.SYSTEM,
    });

    // Remove warning from user record
    return this.userRepository.update(id, {
      bannedReason: null,
      bannedUntil: null,
    });
  }

  async deleteUser(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('ID người dùng không hợp lệ');
    }

    const user = await this.userRepository.findOneById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.userRepository.delete(id);
  }
}
