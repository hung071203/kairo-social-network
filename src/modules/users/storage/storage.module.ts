import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Storage, StorageSchema } from 'src/schemas/storages.schema';
import { StorageRepository } from 'src/database/repository/storage.repository';
import { StorageController } from './storage.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Storage.name, schema: StorageSchema }]),
  ], // Add your Mongoose models here
  providers: [StorageService,
    {
      provide: 'StorageRepositoryInterface',
      useClass: StorageRepository,
    }
  ],
  exports: [StorageService],
  controllers: [StorageController],
})
export class StorageModule {}
