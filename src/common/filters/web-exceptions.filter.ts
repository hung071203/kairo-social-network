import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '../enums';

@Catch()
export class WebExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest();

    // Truyền lỗi vào
    request.session.errorMessage = exception.message || 'An error occurred';

    request.session.errorRedirectCount =
      (request.session.errorRedirectCount || 0) + 1;

    if (exception?.status === 403) {
      request.session.errorRedirectCount = 0; // reset nếu cần
      return response.redirect('/auth/login');
    }

    // Nếu redirect quá 3 lần → về trang mặc định
    if (request.session.errorRedirectCount > 3) {
      // Reset đếm lỗi để không lặp mãi
      request.session.errorRedirectCount = 0;

      const user = request.user;

      if (user?.role === UserRole.USER) {
        return response.redirect('/home');
      } else {
        return response.redirect('/dashboard');
      }
    }

    // Kiểm tra loại lỗi và quyết định chuyển hướng
    if (exception instanceof Error) {
      let previousUrl = '';
      const user = request.user; // Lấy thông tin người dùng từ response locals

      if (user) {
        // Nếu có người dùng, chuyển hướng về trang trước đó
        if (user?.role === UserRole.USER) {
          previousUrl = response.req.headers.referer || '/';
        } else {
          previousUrl = response.req.headers.referer || '/dashboard';
        }
      } else {
        // Nếu không có người dùng, chuyển hướng về trang đăng nhập
        previousUrl = '/auth/login';
      }
      // Nếu có thông tin về trang trước, thực hiện redirect về trang đó
      response.redirect(previousUrl);
    } else {
      // Nếu không có referer, redirect về trang mặc định (ví dụ: /dashboard)
      response.redirect('/auth/login');
    }
  }
}
