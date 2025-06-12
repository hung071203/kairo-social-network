import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AllGuard } from 'src/common/guards/jwt/jwt.guard';

@Controller('chat')
@UseGuards(AllGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @Render('users/pages/chat/index.njk')
  async getChatHome() {
    return {
      title: 'Trò chuyện',
      content: 'users/pages/chat/index.njk',
      data: {},
    };
  }
}
