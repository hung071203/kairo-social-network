import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
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
