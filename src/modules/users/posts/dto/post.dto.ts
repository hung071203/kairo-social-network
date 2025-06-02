import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ArrayMaxSize,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostTypeEnum } from 'src/common/enums';
import { PaginationDto } from 'src/common/decorators';

export class CreatePostDto {
  @IsString()
  @MaxLength(500)
  content: string;

  @IsEnum(PostTypeEnum)
  privacy: PostTypeEnum;

  @ValidateIf((_, value) => value !== undefined)
  @Type(() => Object)
  @ArrayMaxSize(10, { message: 'Tối đa 10 ảnh.' })
  images?: Express.Multer.File[];

  @ValidateIf((_, value) => value !== undefined)
  video?: Express.Multer.File;
}

export class FilterPostDto extends PaginationDto {
  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  seenPostIds?: string;
  
  @IsOptional()
  @IsString()
  author: string;
}

export class SearchPostDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
