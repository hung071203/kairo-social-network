import { Controller, UseGuards } from '@nestjs/common';
import { PostManagementService } from './post-management.service';
import { ModeratorsAuthGuard } from 'src/common/guards/jwt/jwt.guard';

@Controller('post-management')
@UseGuards(ModeratorsAuthGuard)
export class PostManagementController {
  constructor(private readonly postManagementService: PostManagementService) {}
  
}
