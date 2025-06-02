import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { WebContext } from './common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadCatbox } from './utils';

@Controller()
export class AppController {
  constructor(
  ) {}

  @Get()
  getHello(@WebContext() { req, res }: WebContext) {
    res.redirect('/home');
  }
}
