import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

@Schema({ timestamps: true })
export class Tag extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: Number, default: 1 }) // optional: đếm số bài viết sử dụng
  postCount: number;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
TagSchema.plugin(mongoosePaginate);
