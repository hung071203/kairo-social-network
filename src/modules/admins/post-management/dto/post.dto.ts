import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/decorators';

export class FilterPostManagementDto extends PaginationDto {
  @IsOptional()
  search?: string;
}
