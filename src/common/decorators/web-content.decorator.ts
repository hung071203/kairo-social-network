import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';

export interface WebContext {
  req: Request;
  res: Response;
}

export const WebContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): WebContext => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const response = ctx.switchToHttp().getResponse<Response>();
    return { req: request, res: response };
  },
);
