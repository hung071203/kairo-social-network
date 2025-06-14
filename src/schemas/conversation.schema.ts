import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { User } from './users.schema';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({
    type: [
      {
        user: { type: Types.ObjectId, ref: User.name, required: true },
        nickname: { type: String, default: null },
      },
    ],
    required: true,
  })
  participants: { user: Types.ObjectId; nickname?: string }[];

  @Prop({ type: String, default: null })
  lastMessage?: string; // id của message cuối cùng

  @Prop({ type: Date, default: null })
  lastMessageAt?: Date; // thời gian của message cuối cùng

  @Prop({ type: Boolean, default: false })
  isGroup: boolean;

  @Prop({ type: String })
  name?: string; // nếu là group

  @Prop({ type: String, default: '/images/kairo.jpg' })
  avatar: string; // nếu là group
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.plugin(mongoosePaginate);