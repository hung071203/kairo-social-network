import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { UserGenderEnum } from "src/common/enums";
import { IsPhoneInVn, MinAge } from "src/common/validators/custom.validator";

export class UpdateProfileDto {
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
  avatar?: string;

  @IsOptional()
  @IsString()
  background?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @Type(() => Date)
  @MinAge(16, {
    message: 'Bạn phải đủ 16 tuổi trở lên',
  })
  @IsDate()
  birthday?: Date;

  @IsOptional()
  @IsEnum(UserGenderEnum, {
    message: 'Giới tính không hợp lệ',
  })
  gender?: UserGenderEnum;

  @IsOptional()
  @IsPhoneInVn({
    message: 'Số điện thoại không hợp lệ',
  })
  phone?: string;
}
