import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { UsersAuthGuard } from 'src/common/guards/jwt/jwt.guard';
import { GetUser } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';
import { CreateReportDto } from './dto/report.dto';

@Controller('reports')
@UseGuards(UsersAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async createReport(@GetUser() user: User, @Body() dto: CreateReportDto) {
    // Implementation for creating a report
    try {
      return await this.reportService.createReport(user._id as string, dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
