import { IsOptional } from "class-validator";
import { PaginationDto } from "src/common/decorators";

export class FilterTagManagementDto extends PaginationDto {
  @IsOptional()
  search?: string;
}