import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/decorators';
import { NotificationType } from 'src/common/enums';

export class FilterNotiDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true') 
  @IsBoolean()
  isRead?: boolean;
}

export class CreateNotiDto {
  @IsString()
  title: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  systemNotification?: string; // ID của thông báo hệ thống nếu có
}
