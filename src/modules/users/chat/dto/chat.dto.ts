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
}

export class MarkAsReadDto {
  @IsString()
  conversationId: string;

  @IsArray()
  @IsString({ each: true })
  messageIds: string[];
}

export class SearchMessageDto {
  @IsString()
  query: string;
}

export class AddReactionDto {
  @IsString()
  emoji: string;
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
}

export class GetMessagesDto extends PaginationDto{
  @IsString()
  conversationId: string;

  @IsOptional()
  @Type(() => Date)
  createdAt?: Date;
}
