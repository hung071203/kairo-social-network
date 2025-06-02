import { Post } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { User } from './users.schema';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ type: Types.ObjectId, ref: Post.name, required: true })
  post: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  author: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: Comment.name, default: null })
  parentComment?: Types.ObjectId; // reply to another comment
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.plugin(mongoosePaginate);
