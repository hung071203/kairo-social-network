import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schemas/messages.schema';
import { MessageRepository } from 'src/database/repository/message.repository';
import { Conversation, ConversationSchema } from 'src/schemas/conversation.schema';
import { ConversationRepository } from 'src/database/repository/conversation.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }, {
      name: Conversation.name,
      schema: ConversationSchema,
    }]),
  ], // Add your Mongoose models here if needed
  controllers: [ChatController],
  providers: [ChatService,
    {
      provide: 'MessageRepositoryInterface',
      useClass: MessageRepository, // Assuming you have a repository class for Message
    },
    {
      provide: 'ConversationRepositoryInterface',
      useClass: ConversationRepository, // Assuming you have a repository class for Conversation
    }
  ],
})
export class ChatModule {}
