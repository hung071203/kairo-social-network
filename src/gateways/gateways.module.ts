import { Module } from '@nestjs/common';
import { RedisService } from 'src/common/services';

@Module({
  imports: [],
  providers: [RedisService],
  exports: [],
})
export class GatewaysModule {}
