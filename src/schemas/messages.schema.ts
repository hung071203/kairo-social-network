import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { User } from './users.schema';
import { MessageStatusEnum, MessageTypeEnum } from 'src/common/enums';
import { Conversation } from './conversation.schema';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, enum: MessageTypeEnum, default: MessageTypeEnum.TEXT })
  type: MessageTypeEnum;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isDeletedBySender: boolean;

  @Prop({ type: Boolean, default: false })
  isDeletedByReceiver: boolean;

  @Prop({ type: String, enum: MessageStatusEnum, default: MessageStatusEnum.SENT })
  status: MessageStatusEnum;

  @Prop({ type: Types.ObjectId, ref: Conversation.name, required: true })
  conversation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Message.name, default: null })
  replyTo?: Types.ObjectId;

  @Prop({
    type: [
      {
        emoji: { type: String }, // ví dụ: 👍, ❤️, 😂
        userId: { type: Types.ObjectId, ref: User.name },
      },
    ],
    default: [],
  })
  reactions: {
    emoji: string;
    userId: Types.ObjectId;
  }[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.plugin(mongoosePaginate);
