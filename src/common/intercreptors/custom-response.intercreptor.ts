import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const status = response.statusCode;

    const renderTemplate = this.reflector.get<string>(
      '__renderTemplate__',
      context.getHandler(),
    );

    const skipInterceptor = this.reflector.get<boolean>(
      'skipResponseInterceptor',
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => {
        // Bỏ qua nếu là redirect hoặc header đã được gửi
        if (
          skipInterceptor ||
          renderTemplate ||
          response.headersSent ||
          [301, 302, 303, 307, 308].includes(status)
        ) {
          return data;
        }

        // Bọc dữ liệu trong JSON nếu không phải redirect
        return {
          success: true,
          status,
          data,
        };
      }),
    );
  }
}
