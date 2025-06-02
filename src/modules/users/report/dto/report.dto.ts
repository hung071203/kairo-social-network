import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportType } from 'src/common/enums';

export class CreateReportDto {
  @IsString({ message: 'ID mục tiêu không hợp lệ.' })
  target: string;

  @IsString({ message: 'Lý do báo cáo không được để trống.' })
  reason: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsOptional()
  @IsBoolean()
  blockUser?: boolean;
}
