import { Inject, Injectable } from '@nestjs/common';
import { ASSETS_PATH } from 'src/common/constants';
import { StorageRepositoryInterface } from 'src/database/interface/storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import slugify from 'slugify';
import { postImgur, uploadCatbox } from 'src/utils';

const SAVE_PATH = path.join(ASSETS_PATH, 'safe');
@Injectable()
export class StorageService {
  constructor(
    @Inject('StorageRepositoryInterface')
    private readonly storageRepository: StorageRepositoryInterface,
  ) {}

  async createStorage(files: Express.Multer.File[]) {
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(SAVE_PATH)) {
      fs.mkdirSync(SAVE_PATH, { recursive: true });
    }

    const savedMedias = await Promise.all(
      files.map(async (file) => {
        const newFileName = `${Date.now()}-${file.originalname}`;

        // Upload lên Imgur
        // return await postImgur(readStream, newFileName)
        return { url: await uploadCatbox(file.buffer,{
          filename: newFileName,
          mimeType: file.mimetype,
        }), mimeType: file.mimetype };
        // Lưu metadata vào Mongo
        // return await this.storageRepository.create({
        //   fileName: newFileName,
        //   slug,
        //   path: finalPath,
        //   mimeType: file.mimetype,
        //   size: file.size,
        // });
      }),
    );

    return savedMedias;
  }

  async getItemBySlug(slug: string) {
    const item = await this.storageRepository.findOne({ slug });
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }
}
