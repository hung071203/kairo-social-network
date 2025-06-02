import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { logger } from 'src/utils/logger.utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal Server Error';
    let errorName = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorName = exceptionResponse['error'] || 'Internal Server Error';
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        message =
          typeof (exceptionResponse as any).message === 'string'
            ? (exceptionResponse as any).message
            : (exceptionResponse as any).message[0];
      }
    }

    // Log chi tiết lỗi ra terminal
    // console.error(`[ERROR] ${request.method} ${request.url}`);
    // console.error(`Status: ${status}`);
    // console.error(`Message: ${message}`);
    // console.error('Stack Trace:', exception);
    logger.error(
      `[${response.locals.thisIP as string}] ${request.method} ${request.url.split('?')[0]} - ${status} - ${errorName} - ${exception}`,
    );

    response.status(status).json({
      message,
      success: status < 400, // success = true nếu status < 400, ngược lại là false
      type: errorName,
      status,
    });
  }
}
