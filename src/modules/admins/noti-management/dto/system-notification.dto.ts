import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/decorators';
import { NotificationType, SystemNotificationRecipientEnum } from 'src/common/enums';

export class CreateSystemNotificationDto {
  @IsString()
  title: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  message: string;

  @IsArray()
  @IsEnum(SystemNotificationRecipientEnum, { each: true })
  recipients: SystemNotificationRecipientEnum[];

  @IsOptional()
  @IsString()
  redirectUrl?: string;
}

export class FilterSystemNotificationDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsArray()
  @IsEnum(SystemNotificationRecipientEnum, { each: true })
  recipients?: SystemNotificationRecipientEnum[];
}