import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/base/base.abstract.repository';
import { Storage } from 'src/schemas/storages.schema';
import { StorageRepositoryInterface } from '../interface/storage.interface';
import { PaginateModel } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class StorageRepository
  extends BaseRepository<Storage>
  implements StorageRepositoryInterface
{
  constructor(
    @InjectModel(Storage.name)
    private readonly storageRepository: PaginateModel<Storage>,
  ) {
    super(storageRepository);
  }
}
