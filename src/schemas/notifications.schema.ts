import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { User } from './users.schema';
import { NotificationType } from 'src/common/enums';
import { SystemNotification } from './systemNotifications.schema';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Types.ObjectId, ref: SystemNotification.name, default: null })
  systemNotificationId?: Types.ObjectId;

  @Prop({ type: String }) // Đường dẫn frontend để redirect
  redirectUrl?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Add pagination plugin
NotificationSchema.plugin(mongoosePaginate);
NotificationSchema.index({ user: 1, isRead: 1 });
