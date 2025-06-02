import {
  Model,
  Document,
  PaginateModel,
  PaginateOptions,
  PaginateResult,
} from 'mongoose';
import { BaseRepositoryInterface } from './base.interface.repository';

export class BaseRepository<T extends Document> implements BaseRepositoryInterface<T> {
  constructor(private readonly model: PaginateModel<T>) {}

  async create(item: Partial<T>): Promise<T> {
    const newItem = new this.model(item);
    return newItem.save();
  }

  async findAll(
    condition: object = {},
    paginate?: PaginateOptions,
  ): Promise<PaginateResult<T> | T[]> {
    if (paginate && paginate.page && paginate.limit) {
      return this.model.paginate(condition, paginate);
    } else {
      return this.model.find(condition).exec();
    }
  }

  async findOneById(id: string): Promise<T> {
    return this.model.findById(id).exec();
  }

  async findOne(condition: object): Promise<T> {
    const result = await this.model.findOne(condition).exec();
    if (!result) return null;
    return result.toObject() as T;
  }

  async count(condition: object): Promise<number> {
    return this.model.countDocuments(condition).exec();
  }

  async update(id: string, item: Partial<T>): Promise<T> {
    return this.model.findByIdAndUpdate(id, item, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  getModel(): PaginateModel<T> {
    return this.model;
  }
}
