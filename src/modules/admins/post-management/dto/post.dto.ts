import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from 'src/common/decorators';

export class FilterPostManagementDto extends PaginationDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  tagName?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  isVisible?: boolean;
}
