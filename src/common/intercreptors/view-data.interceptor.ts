import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { UserRepositoryInterface } from 'src/database/interface/user.interface';

@Injectable()
export class ViewData implements NestInterceptor {
  constructor(
    private jwtService: JwtService,
    @Inject('UserRepositoryInterface')
    private userRepository: UserRepositoryInterface,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    if (!res.locals.user) {
      const token = request?.cookies?.hungdev_token_media;
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.SECREST_JWT,
          });

          const user = await this.userRepository.findOne({ _id: payload.sub });
          if (!user) {
            throw new Error('Token không hợp lệ');
          }

          res.locals.user = user;
        } catch (error) {
          res.clearCookie('hungdev_token_media', { httpOnly: true });
          throw new UnauthorizedException(error.message || 'Xác thực thất bại');
        }
      }
    }

    return next.handle();
  }
}
