import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { Tag } from './tags.chema';
import { User } from './users.schema';
import { PostTypeEnum } from 'src/common/enums';
import { PostMediaUrl } from 'src/common/constants/interface.constant';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  author: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: Boolean, default: false })
  isPinned: boolean;

  @Prop({
    type: [
      {
        url: { type: String, required: true },
        mimeType: { type: String, required: true },
      },
    ],
    default: [],
  }) // URL hình ảnh, video,...
  mediaUrls: PostMediaUrl[];

  @Prop({ type: [Types.ObjectId], ref: User.name, default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  commentsCount: number;

  @Prop({ type: Number, default: 0 })
  sharesCount: number;

  @Prop({ type: String, enum: PostTypeEnum, default: PostTypeEnum.FOLLOWERS })
  type: PostTypeEnum;

  @Prop({ type: [Types.ObjectId], ref: Tag.name, default: [] })
  tags: Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.plugin(mongoosePaginate);
