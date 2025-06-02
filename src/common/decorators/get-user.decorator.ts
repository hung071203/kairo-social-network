import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const response = ctx.switchToHttp().getResponse();
    const user = response.locals.user;

    if (!user) return null;
    return user;
  },
);
