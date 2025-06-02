import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from 'src/common/enums';

@Injectable()
export class UsersAuthGuard extends AuthGuard('users-jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = (await super.canActivate(context)) as boolean;

    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Không xác thực được người dùng.');
    }

    if (user.role !== UserRole.USER) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào tài nguyên này.',
      );
    }
    response.locals.user = user; // ✅ Gán vào locals

    return can;
  }
}

@Injectable()
export class ModeratorsAuthGuard extends AuthGuard('users-jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = (await super.canActivate(context)) as boolean;

    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const user = request.user;
    if (!user) {
      // ✅ Gán vào locals
      throw new UnauthorizedException('Không xác thực được người dùng.');
    }
    const validRole = [UserRole.MOD, UserRole.ADMIN];
    if (!validRole.includes(user.role)) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào tài nguyên này.',
      );
    }
    response.locals.user = user;
    return can;
  }
}

@Injectable()
export class AdminAuthGuard extends AuthGuard('users-jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = (await super.canActivate(context)) as boolean;

    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('Không xác thực được người dùng.');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập vào tài nguyên này.',
      );
    }

    response.locals.user = user; // ✅ Gán vào locals
    return can;
  }
}
