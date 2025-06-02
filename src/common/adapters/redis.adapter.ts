// redis.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { logger } from 'src/utils';

@Injectable()
export class RedisIoAdapter extends IoAdapter {
  private pubClient;
  private subClient;

  async connectToRedis(): Promise<void> {
    try {
      this.pubClient = createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        password: process.env.REDIS_PASSWORD,
      });

      this.subClient = this.pubClient.duplicate();

      this.pubClient.on('error', (err) => {
        logger.error('Redis pubClient error:', err);
      });

      this.subClient.on('error', (err) => {
        logger.error('Redis subClient error:', err);
      });

      logger.info('Connecting to RedisIoAdapter...');
      await this.pubClient.connect();
      await this.subClient.connect();
      logger.info('Connected to RedisIoAdapter successfully!');
    } catch (error) {
      logger.error('Error connecting to RedisIoAdapter:', error);
      throw error;
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(createAdapter(this.pubClient, this.subClient));
    return server;
  }

  // Thêm getter để lấy pubClient
  getRedisClient() {
    return this.pubClient;
  }
}