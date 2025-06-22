import { Inject, Injectable } from '@nestjs/common';
import { RedisService } from 'src/common/services';
import { UserRepositoryInterface } from 'src/database/interface/user.interface';
import { MailService } from 'src/mail/mail.service';
import {
  LoginDto,
  SignupDto,
  VerifyEmailDto,
} from './dto/update-authentication.dto';
import { TypeVerifyEmailEnum } from 'src/common/enums';
import axios from 'axios';
import { comparePassword, generateRandomString, hashPassword } from 'src/utils';
import { generateUsername } from 'src/common/helpers';
import { JwtService } from '@nestjs/jwt';
import { UserGG } from 'src/common/decorators';

@Injectable()
export class AuthService {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  getUserRepository() {
    return this.userRepository;
  }

  async verifyEmail(ip: string, dto: VerifyEmailDto) {
    const { email, 'cf-turnstile-response': token, type } = dto;
    await this.verifyCaptcha(token, ip);

    const redisKey = `${process.env.APP_ID}:verify-email:${type}:${email}`;
    const dataRedis = await this.redisService.get(redisKey);
    const data = JSON.parse(dataRedis || '{}');

    const user = await this.userRepository.findOne({ email });

    if (type === TypeVerifyEmailEnum.FORGOT && !user) {
      throw new Error('Email không tồn tại!');
    }

    if (
      (type === TypeVerifyEmailEnum.SIGNUP ||
        type === TypeVerifyEmailEnum.CHANGE_MAIL) &&
      user
    ) {
      throw new Error('Email đã tồn tại!');
    }

    if (dataRedis && data.expire > Date.now()) {
      throw new Error('Vui lòng đợi 1 phút trước khi thử lại!');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.redisService.set(
      redisKey,
      JSON.stringify({
        code,
        expire: Date.now() + 60 * 1000,
      }),
      60 * 10, // 10 phút
    );

    await this.sendMail({
      email,
      otp: code,
      type,
    });

    return true;
  }

  async sendMail({
    email,
    subject,
    pass,
    otp,
    type,
  }: {
    email: string;
    subject?: string;
    text?: string;
    pass?: string;
    otp?: string;
    type: string;
  }) {
    // Gửi email
    const form = {
      from: '"Hùng Dev" <admin@hungdev.id.vn>', // Người gửi
      to: email, // Người nhận
      subject: subject ? subject : 'Your Web Access Code', // Tiêu đề email
      template: 'otp', // Template email
      otp,
      pass,
      isSignup: type === TypeVerifyEmailEnum.SIGNUP,
      isForgot: type === TypeVerifyEmailEnum.FORGOT,
      isMail: type === TypeVerifyEmailEnum.CHANGE_MAIL,
      isSendPass: type === 'sendPass',
    };
    await this.mailService.sendMail(form);
  }

  async verifyCaptcha(token: string, ip: string) {
    const response = await axios.post(process.env.CAPTCHA_URL, {
      secret: process.env.CAPTCHA_SECRET_KEY,
      response: token,
      remoteip: ip,
    });
    if (!response.data.success)
      throw new Error(
        'Captcha không hợp lệ, vui lòng đợi vài giây trước khi thực hiện hành động!',
      );
  }

  async signup(dto: SignupDto) {
    const { email, password, otp } = dto;
    const dataRedis = await this.redisService.get(
      `${process.env.APP_ID}:verify-email:${TypeVerifyEmailEnum.SIGNUP}:${email}`,
    );
    if (!dataRedis) throw new Error('Mã xác thực không hợp lệ!');
    const data = JSON.parse(dataRedis || '{}');
    if (otp !== data?.code) throw new Error('Mã xác thực không hợp lệ!');

    const user = await this.userRepository.findOne({ email });
    if (user) throw new Error('Email đã tồn tại!');

    return this.createUser({
      email,
      password,
      phone: dto.phone,
      name: dto.name,
    });
  }

  async createUser(dto: any) {
    const hashedPass = await hashPassword(
      dto.password || generateRandomString(30),
    );
    const res = await this.userRepository.create({
      ...dto,
      username: generateUsername(dto.name),
      ...(dto.password ? { password: hashedPass } : {}),
    });
    return res;
  }

  async login(ip: string, dto: LoginDto) {
    const { email, password, 'cf-turnstile-response': token } = dto;
    await this.verifyCaptcha(token, ip);

    const user = await this.userRepository.findOne({
      email,
    });

    if (!user) throw new Error('Email hoặc mật khẩu không đúng!');

    const isValidPass = await comparePassword(password, user.password);
    if (!isValidPass) throw new Error('Email hoặc mật khẩu không đúng!');
    const payload = {
      sub: user._id.toString(),
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, role: user.role };
  }

  async googleLogin({ email, firstName, lastName, googleId }: UserGG, ip: string) {
    const user = await this.userRepository.findOne({ email });

    if (user) {
      const payload = {
        sub: user._id.toString(),
        role: user.role,
      };
      const accessToken = await this.jwtService.signAsync(payload);
      return {token: accessToken, role: user.role};
    } else {
      const data = await this.createUser({
        email,
        name: `${firstName} ${lastName}`,
        phone: '',
        googleId,
      });

      const payload = {
        sub: data._id as string,
        role: data.role,
      };
      const accessToken = await this.jwtService.signAsync(payload);
      return {token: accessToken, role: data.role};
    }
  }

  async createSpam(dto: SignupDto) {
    const { otp, 'cf-turnstile-response': token, ...data } = dto;
    return this.userRepository.create({
      ...data,
      password: await hashPassword(data.password),
      username: generateUsername(data.name),
    })
  }
}
