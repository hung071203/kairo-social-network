import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Render,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AllGuard } from 'src/common/guards/jwt/jwt.guard';
import { GetUser, Pagination, PaginationDto } from 'src/common/decorators';
import { User } from 'src/schemas/users.schema';
import {
  CreateConversationDto,
  GetConversationsDto,
  GetMessagesDto,
  SendMessageDto,
} from './dto/chat.dto';

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
  @Post('conversation')
  async createConversation(
    @GetUser() user: User,
    @Body() dto: CreateConversationDto,
  ) {
    try {
      return await this.chatService.createConversation(user._id as string, dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('conversation')
  async getConversations(
    @GetUser() user: User,
    @Query() dto: GetConversationsDto,
    @Pagination() pagi: PaginationDto,
  ) {
    try {
      return await this.chatService.getConversations(
        user._id as string,
        dto,
        pagi,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('messages')
  async getMessages(
    @GetUser() user: User,
    @Query() dto: GetMessagesDto,
    @Pagination() pagi: PaginationDto,
  ) {
    try {
      return await this.chatService.getMessages(user._id.toString(), dto, pagi);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('hidden-all-mesages/:conversationId')
  async hiddenAllMessages(@GetUser() user: User, @Param('conversationId') conversationId: string) {
    try {
      return await this.chatService.hiddenAllMessages(user._id.toString(), conversationId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
