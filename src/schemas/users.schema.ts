import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { UserGenderEnum, UserRole } from 'src/common/enums';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: Date, default: null })
  bannedUntil: Date;

  @Prop({ type: String, default: null })
  bannedReason: string;

  @Prop({ default: '/images/kairo.jpg' })
  avatar: string;

  @Prop({ type: Boolean, default: false })
  isPrivate: boolean;

  @Prop({ default: '' })
  bio: string;

  @Prop({ type: Date, default: null })
  birthday: Date;

  @Prop({ type: String, enum: UserGenderEnum, default: UserGenderEnum.OTHER })
  gender: UserGenderEnum;

  @Prop({ type: String, default: null })
  phone?: string;

  @Prop({ type: String, default: '/images/bg.jpg' })
  background: string;

  @Prop({ type: String, default: null })
  googleId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(mongoosePaginate);

// Index để tối ưu tìm kiếm
UserSchema.index({ name: 1 });