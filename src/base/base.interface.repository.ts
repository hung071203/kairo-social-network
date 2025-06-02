import { Model, PaginateModel, PaginateOptions, PaginateResult } from 'mongoose';

export interface BaseRepositoryInterface<T> {
  create(item: Partial<T>): Promise<T>;
  findAll(
    condition?: object,
    paginate?: PaginateOptions,
  ): Promise<PaginateResult<T> | T[]>;
  findOneById(id: string): Promise<T>;
  findOne(condition: object): Promise<T>;
  count(condition: object): Promise<number>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  getModel(): PaginateModel<T>;
}
