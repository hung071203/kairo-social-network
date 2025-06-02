import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { User } from './users.schema';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  receiver: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.plugin(mongoosePaginate);
