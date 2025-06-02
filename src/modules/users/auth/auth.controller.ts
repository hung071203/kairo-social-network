import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Render,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GetIp, GetUserGG, UserGG, WebContext } from 'src/common/decorators';
import { AllExceptionsFilter, WebExceptionFilter } from 'src/common/filters';
import {
  LoginDto,
  SignupDto,
  VerifyEmailDto,
} from './dto/update-authentication.dto';
import { UserRole } from 'src/common/enums';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
@UseFilters(WebExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  @Render('admins/pages/auth/login.njk')
  getFormLogin(@WebContext() { req }: WebContext) {
    return {
      capchaPublicKey: process.env.CAPTCHA_PUBLIC_KEY,
    };
  }

  @Get('forgot-password')
  @Render('admins/pages/auth/forgotPass.njk')
  getFormForgotPassword(@WebContext() { req }: WebContext) {
    return {
      capchaPublicKey: process.env.CAPTCHA_PUBLIC_KEY,
    };
  }

  @Get('signup')
  @Render('admins/pages/auth/signup.njk')
  getFormSignup(@WebContext() { req }: WebContext) {
    return {
      capchaPublicKey: process.env.CAPTCHA_PUBLIC_KEY,
    };
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto, @WebContext() { req, res }: WebContext) {
    try {
      await this.authService.signup(dto);
      req.session.successMessage = 'Đăng ký thành công!';
      res.redirect('/auth/login');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('verify-email')
  @UseFilters(AllExceptionsFilter)
  async verifyEmail(@Body() dto: VerifyEmailDto, @GetIp() ip: string) {
    try {
      await this.authService.verifyEmail(ip, dto);
      return 'Đã gửi mã xác thực email thành công!';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @WebContext() { req, res }: WebContext,
    @GetIp() ip: string,
  ) {
    try {
      const { accessToken, role } = await this.authService.login(ip, dto);
      res.cookie('hungdev_token_media', accessToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      req.session.successMessage = 'Đăng nhập thành công!';
      if (role == UserRole.USER) {
        res.redirect('/home');
      } else {
        res.redirect('/admin/dashboard');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Đây chỉ là bước chuyển hướng, chưa có dữ liệu user
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@GetUserGG() user: UserGG, @GetIp() ip: string, @WebContext() { req, res }: WebContext) {
    try {
      const {token, role} = await this.authService.googleLogin(user, ip);
      if (!token) throw new Error('Đăng nhập thất bại!');
      res.cookie('hungdev_token_media', token, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      req.session.successMessage = 'Đăng nhập thành công!';
      if (role == UserRole.USER) {
        res.redirect('/home');
      } else {
        res.redirect('/admin/dashboard');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('create-user')
  async createUser(
    @Body() dto: SignupDto,
  ) {
    try {
      const user = await this.authService.createSpam(dto);
      return { message: 'Tạo người dùng thành công', user };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
