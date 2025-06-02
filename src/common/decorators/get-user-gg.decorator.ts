import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserGG {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  imageUrl: string;
}

export const GetUserGG = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserGG => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new Error('User profile is missing');
    }

    return user
  },
);
