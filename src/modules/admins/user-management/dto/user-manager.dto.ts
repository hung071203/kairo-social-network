import { IsOptional, IsString, IsEmail, IsEnum, IsDateString } from 'class-validator';
import { PaginationDto } from 'src/common/decorators';
import { UserRole, UserGenderEnum, UserStatusEnum } from 'src/common/enums';


export class FilterUserDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatusEnum)
  status?: UserStatusEnum;
}

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserGenderEnum)
  gender?: UserGenderEnum;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserGenderEnum)
  gender?: UserGenderEnum;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class BanUserDto {
  @IsOptional()
  @IsDateString()
  bannedUntil?: string;

  @IsOptional()
  @IsString()
  bannedReason?: string;
}
