import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetIp = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const response = ctx.switchToHttp().getResponse();
    const ip = response.locals.thisIP;
    return ip as string
  },
);
