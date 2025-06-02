import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisService } from 'src/common/services';
import { MailModule } from 'src/mail/mail.module';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [MailModule],
  controllers: [AuthController],
  providers: [AuthService, RedisService, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
