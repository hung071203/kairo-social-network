import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { config } from 'dotenv';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID, // Google Client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google Client Secret
      callbackURL: "/auth/google/callback", // Callback URL sau khi Google xác thực
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    // Đối với Google OAuth, `profile` chứa thông tin người dùng đã đăng nhập
    // Xử lý thông tin người dùng và lưu vào cơ sở dữ liệu nếu cần
    return {
      email: profile.emails[0].value,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      googleId: profile.id,
      imageUrl: profile.photos[0].value,
    };
  }
}
