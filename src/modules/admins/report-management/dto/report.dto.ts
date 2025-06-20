import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/decorators';
import { ReportType } from 'src/common/enums';

export class FilterReportManagementDto extends PaginationDto {
  @IsOptional()
  search?: string; // Optional search parameter for filtering reports

  @IsOptional()
  @IsEnum(ReportType)
  type: ReportType;

  @IsOptional()
  @Transform(({ value }) => {
    // Convert string to boolean if provided
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  isResolved?: boolean; // Optional filter for resolved reports
}
