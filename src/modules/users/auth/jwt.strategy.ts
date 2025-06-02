import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { logger } from 'src/utils';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'users-jwt') {
  constructor(
    private configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.hungdev_token_media || null,
      ]),
      secretOrKey: configService.get<string>('SECREST_JWT'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any, done: VerifiedCallback) {
    try {
      const user = await this.authService.getUserRepository().findOne({
        _id: payload.sub,
      });
      if (!user) {
        throw new Error('Token không hợp lệ');
      }

      return done(null, user);
    } catch (error) {
      logger.error('JWT Strategy Error:', error);
      throw new BadRequestException(error.message || 'Xác thực thất bại');
    }
  }
}
