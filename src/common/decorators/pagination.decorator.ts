import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'Page', example: 1 })
  page: number;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'Limit', example: 10 })
  limit: number;

  @IsOptional()
  @ApiProperty({ description: 'Offset', example: 0 })
  offset: number;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const pagination = {
      page: 1,
      limit: 10,
      offset: 0,
      sort: {
        [(request.query?.sort as string) || 'createdAt']:
          request.query?.order == 'asc' ? 1 : -1,
      },
    };
    const page = request.query?.page as string;
    const limit = request.query?.limit as string;
    const p = parseInt(page);
    const l = parseInt(limit) || 10;
    if (typeof p == 'number' && typeof l == 'number' && p >= 1 && l >= 1) {
      pagination.page = p;
      pagination.limit = l;
      pagination.offset = l * (p - 1);
    }
    
    return pagination;
  },
);
