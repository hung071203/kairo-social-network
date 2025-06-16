import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { User } from './users.schema';
import { MessageTypeEnum, SenderTypeEnum } from 'src/common/enums';
import { Conversation } from './conversation.schema';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  sender: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, enum: MessageTypeEnum, default: MessageTypeEnum.TEXT })
  type: MessageTypeEnum;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  deletedBy: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: Conversation.name, required: true })
  conversation: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Message.name, default: null })
  replyTo?: Types.ObjectId;

  @Prop({
    type: [
      {
        reaction: { type: String }, // ví dụ: 👍, ❤️, 😂
        user: { type: Types.ObjectId, ref: User.name },
      },
    ],
    default: [],
  })
  reactions: {
    reaction: string;
    user: Types.ObjectId;
  }[];

  @Prop({ type: String, enum: SenderTypeEnum, default: SenderTypeEnum.USER })
  senderType: SenderTypeEnum;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.plugin(mongoosePaginate);
