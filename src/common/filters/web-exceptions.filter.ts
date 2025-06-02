import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class WebExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest();

    // Truyền lỗi vào 
    request.session.errorMessage = exception.message || 'An error occurred';
    
    // Kiểm tra loại lỗi và quyết định chuyển hướng
    if (exception instanceof Error) {
      // Nếu có thông tin về trang trước, thực hiện redirect về trang đó
      const previousUrl = response.req.headers.referer || '/auth/login';
      response.redirect(previousUrl);
    } else {
      // Nếu không có referer, redirect về trang mặc định (ví dụ: /dashboard)
      response.redirect('/auth/login');
    }
  }
}

