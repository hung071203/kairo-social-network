import { IsOptional, IsString, IsNotEmpty } from "class-validator";
import { PaginationDto } from "src/common/decorators";

export class FilterTagManagementDto extends PaginationDto {
  @IsOptional()
  search?: string;
}

export class UpdateTagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  isActive?: boolean;
}