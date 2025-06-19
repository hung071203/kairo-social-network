import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ProfileService {
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
}
