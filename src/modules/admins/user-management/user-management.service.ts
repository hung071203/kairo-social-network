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

@Injectable()
export class UserManagementService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  getRepository() {
    return this.userRepository;
  }

  async getUsers(dto: FilterUserDto, pagination: PaginationDto) {
    const searchConditions: any[] = [];

    if (dto.search) {
      // Nếu là ObjectId hợp lệ → tìm chính xác theo _id
      if (isValidObjectId(dto.search)) {
        searchConditions.push({ _id: dto.search });
      } else {
        searchConditions.push(
          { username: { $regex: dto.search, $options: 'i' } },
          { name: { $regex: dto.search, $options: 'i' } },
          { email: { $regex: dto.search, $options: 'i' } },
        );
      }
    }

    const form: any = {};

    if (searchConditions.length > 0) {
      form.$or = searchConditions;
    }

    return this.userRepository.findAll(form, pagination);
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

    // Don't return password
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
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

    return this.userRepository.update(id, {
      bannedReason: reason,
      bannedUntil: null, // Warning without ban
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
