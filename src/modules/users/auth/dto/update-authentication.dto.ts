import { PartialType } from '@nestjs/swagger';
import { CreateAuthenticationDto } from './create-authentication.dto';
import { IsGmail, IsValidPass } from 'src/common/validators/custom.validator';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TypeVerifyEmailEnum } from 'src/common/enums';

export class UpdateAuthenticationDto extends PartialType(
  CreateAuthenticationDto,
) {}

export class LoginDto {
  @IsGmail({
    message: 'Email không hợp lệ, chỉ nhận gmail.com',
  })
  email: string;

  @IsValidPass()
  password: string;

  @IsString()
  'cf-turnstile-response': string;
}

export class VerifyEmailDto {
  @IsGmail({
    message: 'Email không hợp lệ, chỉ nhận gmail.com',
  })
  email: string;

  @IsString()
  'cf-turnstile-response': string;

  @IsEnum(TypeVerifyEmailEnum)
  type: TypeVerifyEmailEnum;
}

export class ForgotPasswordDto {
  @IsGmail({
    message: 'Email không hợp lệ, chỉ nhận gmail.com',
  })
  email: string;

  @IsString()
  otp: string;

  @IsString()
  @IsOptional()
  'cf-turnstile-response': string;
}

export class SignupDto {
  @IsString()
  name: string;

  @IsValidPass()
  password: string;

  @IsString()
  otp: string;

  @IsString()
  phone: string;

  @IsGmail()
  email: string;

  @IsString()
  @IsOptional()
  'cf-turnstile-response': string;
}
