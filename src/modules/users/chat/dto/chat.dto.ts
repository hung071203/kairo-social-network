import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { PaginationDto } from 'src/common/decorators';
import { MessageTypeEnum } from 'src/common/enums';

export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsOptional()
  @IsBoolean()
  isGroup?: boolean = false;

  @IsOptional()
  @IsString()
  name?: string;
}

export class SendMessageDto {
  @IsString()
  conversationId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageTypeEnum)
  type?: MessageTypeEnum;

  @IsOptional()
  @IsString()
  replyTo?: string;

  @IsOptional()
  @IsString()
  tempId?: string;
}

export class SearchMessageDto {
  @IsString()
  query: string;
}

export class AddReactionDto {
  @IsString()
  reaction?: string;

  @IsString()
  messageId: string;

  @IsString()
  conversationId: string;
}

export class UpdateNicknameDto {
  @IsString()
  targetUserId: string;

  @IsString()
  nickname: string;
}

export class GetConversationsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  userId?: string; // ID của người dùng để lọc cuộc trò chuyện

  @IsOptional()
  @IsString()
  conversationId?: string; // ID của cuộc trò chuyện để lọc
}

export class GetMessagesDto extends PaginationDto{
  @IsString()
  conversationId: string;

  @IsOptional()
  @Type(() => Date)
  createdAt?: Date; // Thời gian để phân trang, lấy các tin nhắn trước thời điểm này
}
