import { Post } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { User } from './users.schema';
import { FollowInteractionStatusEnum } from 'src/common/enums';

@Schema({ timestamps: true })
export class FollowInteraction extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  requester: Types.ObjectId; // người gửi yêu cầu follow

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  target: Types.ObjectId; // người được yêu cầu follow

  @Prop({ type: String, enum: FollowInteractionStatusEnum, default: FollowInteractionStatusEnum.PENDING })
  status: FollowInteractionStatusEnum; // trạng thái yêu cầu follow
}

export const FollowInteractionSchema = SchemaFactory.createForClass(FollowInteraction);
FollowInteractionSchema.plugin(mongoosePaginate);