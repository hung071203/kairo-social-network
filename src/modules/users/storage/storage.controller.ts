import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { StorageService } from './storage.service';
import { SkipResponseInterceptor, WebContext } from 'src/common/decorators';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadCatbox } from 'src/utils';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('item/:slug')
  @SkipResponseInterceptor()
  async getItemBySlug(
    @Param('slug') slug: string,
    @WebContext() { res }: WebContext,
  ) {
    try {
      const item = await this.storageService.getItemBySlug(slug);

      const filePath = item.path;
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found at: ' + filePath);
      }

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('File is empty at: ' + filePath);
      }

      // Đọc toàn bộ nội dung file
      const fileData = fs.readFileSync(filePath);
      res.send(fileData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async handleUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const catboxUrl = await uploadCatbox(file.buffer, {
        filename: file.originalname,
        mimeType: file.mimetype,
      });

      return {
        message: 'Tải lên thành công!',
        url: catboxUrl,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
