import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { CacheModule } from '@nestjs/cache-manager';
import { GuardsModule } from './common/guards/guards.module';
import { ConfigModule } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ResponseInterceptor } from './common/intercreptors';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailModule } from './mail/mail.module';
import { RedisService } from './common/services';
import { GatewaysModule } from './gateways/gateways.module';
import { UsersModule } from './modules/users/users.module';
import { AdminsModule } from './modules/admins/admins.module';

dotenv.config();
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    CacheModule.register({
      ttl: 5, // Thời gian sống của cache (tính bằng giây)
      max: 100, // Giới hạn số lượng dữ liệu trong cache
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true, // Giúp module có sẵn toàn cục
    }),
    GuardsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: process.env.SECREST_JWT,
      signOptions: { expiresIn: '30d' },
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: Number(process.env.MAIL_PORT) === 465,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM,
      },
      template: {
        dir: process.cwd() + '/src/mail/templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    MailModule,
    GatewaysModule,
    UsersModule,
    AdminsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor, // Đăng ký ResponseInterceptor toàn cục
    },
    RedisService,
  ],
})
export class AppModule {}
