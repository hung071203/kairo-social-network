import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { NotificationType, SystemNotificationRecipientEnum } from 'src/common/enums';

@Schema({ timestamps: true })
export class SystemNotification extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, type: [String], enum: SystemNotificationRecipientEnum })
  recipients: SystemNotificationRecipientEnum[];

  @Prop({ type: String }) // Đường dẫn frontend để redirect
  redirectUrl?: string;
}

export const SystemNotificationSchema =
  SchemaFactory.createForClass(SystemNotification);

// Add pagination plugin
SystemNotificationSchema.plugin(mongoosePaginate);
SystemNotificationSchema.index({ user: 1, isRead: 1 });
