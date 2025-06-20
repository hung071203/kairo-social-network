import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AppConstant } from './common/constants';
import { AllExceptionsFilter } from './common/filters';
import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import * as nunjucks from 'nunjucks';
import { RedisIoAdapter } from './common/adapters';
import { RedisStore } from 'connect-redis';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.enable('trust proxy');

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(); // ⚠️ Quan trọng
  app.useWebSocketAdapter(redisIoAdapter);

  app.useGlobalFilters(new AllExceptionsFilter()); // 🔹 Đăng ký filter toàn cục

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Xóa các biến không có trong DTO
      forbidNonWhitelisted: true, // Chặn luôn nếu có biến lạ
      transform: true, // Tự động chuyển đổi dữ liệu về kiểu DTO
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      exceptionFactory: (validationErrors) => {
        const messages = validationErrors.map((error) => {
          return `${Object.values(error.constraints).join(', ')}`;
        });

        // Tạo object lỗi chi tiết thay vì chỉ ném mảng messages
        throw new UnprocessableEntityException({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: 'Unprocessable Entity',
          message: messages.join(', '),
        });
      },
    }),
  );
  const viewsPath = path.join(process.cwd(), 'src', 'views');

  app.setBaseViewsDir(viewsPath);
  app.useStaticAssets(path.join(process.cwd(), 'src', 'public'));
  app.use(cookieParser()); // Kích hoạt cookie-parser

  const env = nunjucks.configure(viewsPath, {
    autoescape: true, // tự động escape HTML
    express: app.getHttpAdapter().getInstance(), // Cung cấp đối tượng express cho Nunjucks
    noCache: process.env.APP_ID === 'dev', // Bỏ cache trong môi trường dev
  });
  
  env.addFilter('formatDate', (value: any, format = 'DD/MM/YYYY HH:mm:ss') => {
    const timestamp = !value || value === 'now' ? Date.now() : Number(value);
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return '';

    // ✅ Trả về string
    const pad = (n: number): string => (n < 10 ? '0' + n : n.toString());

    const DD = pad(date.getDate());
    const MM = pad(date.getMonth() + 1);
    const YYYY = date.getFullYear().toString(); // ✅ ép về string

    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    return format
      .replace('DD', DD)
      .replace('MM', MM)
      .replace('YYYY', YYYY)
      .replace('HH', HH)
      .replace('mm', mm)
      .replace('ss', ss);
  });

  // Add date filter as alias for formatDate
  env.addFilter('date', (value: any, format = 'DD/MM/YYYY HH:mm:ss') => {
    const timestamp = !value || value === 'now' ? Date.now() : Number(value);
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return '';

    // ✅ Trả về string
    const pad = (n: number): string => (n < 10 ? '0' + n : n.toString());

    const DD = pad(date.getDate());
    const MM = pad(date.getMonth() + 1);
    const YYYY = date.getFullYear().toString(); // ✅ ép về string

    const HH = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    return format
      .replace('DD', DD)
      .replace('MM', MM)
      .replace('YYYY', YYYY)
      .replace('HH', HH)
      .replace('mm', mm)
      .replace('ss', ss);
  });

  // Thêm filter để kiểm tra xem thời gian có trong tương lai không
  env.addFilter('isFuture', (value: any) => {
    if (!value) return false;
    const timestamp =
      typeof value === 'string' ? new Date(value).getTime() : Number(value);
    return timestamp > Date.now();
  });

  // Thêm filter để lấy timestamp hiện tại để so sánh
  env.addFilter('now', () => {
    return Date.now();
  });

  app.setViewEngine('njk');

  const redisClient = redisIoAdapter.getRedisClient();

  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SECREST_JWT,
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use((req: any, res: any, next: () => void) => {
    res.locals.path = req.path;
    res.locals.baseUrl = req.protocol + '://' + req.get('host');
    AppConstant.baseUrl = res.locals.baseUrl;

    res.locals.thisIP =
      req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    res.locals.errorMessage = req.session.errorMessage;
    res.locals.successMessage = req.session.successMessage;
    res.locals.query = req.query;
    delete req.session.errorMessage;
    delete req.session.successMessage;
    res.on('finish', () => {
      delete res.locals.errorMessage;
      delete res.locals.successMessage;
    });

    res.locals.getColor = (text: string) => {
      const colors = [
        'dark',
        'info',
        'warning',
        'danger',
        'success',
        'secondary',
        'primary',
      ];
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    next(); // Tiến hành xử lý tiếp
  });

  const directory = path.join(
    process.cwd(),
    'src',
    'common',
    'assets',
    'cache',
  );
  if (fs.existsSync(directory)) {
    // Nếu thư mục đã tồn tại, xóa tất cả các file và thư mục con
    fs.readdirSync(directory).forEach((file) => {
      const filePath = path.join(directory, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        // Xóa thư mục con nếu có
        fs.rmdirSync(filePath, { recursive: true });
      } else {
        // Xóa file
        fs.unlinkSync(filePath);
      }
    });
  } else {
    // Nếu thư mục chưa tồn tại, tạo mới
    fs.mkdirSync(directory, { recursive: true });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
