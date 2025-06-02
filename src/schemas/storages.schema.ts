import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

@Schema({ timestamps: true })
export class Storage extends Document {
  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: String, required: true })
  mimeType: string;

  @Prop({ type: String, required: true })
  path: string;

  @Prop({ type: Number, required: true })
  size: number;
}

export const StorageSchema = SchemaFactory.createForClass(Storage);
StorageSchema.plugin(mongoosePaginate);