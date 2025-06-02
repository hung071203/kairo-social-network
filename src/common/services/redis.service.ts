import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { logger } from 'src/utils/logger.utils';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private static sharedClient: RedisClientType | null = null;
  private client: RedisClientType;

  constructor() {
    // Chỉ tạo client mới nếu chưa tồn tại
    if (!RedisService.sharedClient) {
      RedisService.sharedClient = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        password: process.env.REDIS_PASSWORD,
      });
    }
    this.client = RedisService.sharedClient;
  }

  async onModuleInit() {
    // Chỉ kết nối nếu chưa kết nối
    if (!this.client.isOpen) {
      await this.client.connect();
      logger.info('Redis connected');
    }
  }

  async onModuleDestroy() {
    // Chỉ ngắt kết nối nếu đang kết nối
    if (this.client.isOpen) {
      await this.client.disconnect();
      logger.debug('Redis disconnected');
    }
  }

  // --- String Operations ---
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return this.client.expire(key, ttl);
  }

  // --- Hash Operations ---
  async hSet(key: string, field: string, value: string): Promise<number> {
    return this.client.hSet(key, field, value);
  }

  async hGet(key: string, field: string): Promise<string | null> {
    return this.client.hGet(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hGetAll(key);
  }

  async hDel(key: string, field: string): Promise<number> {
    return this.client.hDel(key, field);
  }

  async hExists(key: string, field: string): Promise<boolean> {
    return this.client.hExists(key, field);
  }

  // --- Set Operations ---
  async sAdd(key: string, value: string): Promise<number> {
    return this.client.sAdd(key, value);
  }

  async sMembers(key: string): Promise<string[]> {
    return this.client.sMembers(key);
  }

  async sRem(key: string, value: string): Promise<number> {
    return this.client.sRem(key, value);
  }

  async sIsMember(key: string, value: string): Promise<boolean> {
    return this.client.sIsMember(key, value);
  }
}