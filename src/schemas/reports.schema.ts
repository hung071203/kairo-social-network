import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { User } from './users.schema';
import { ReportType } from 'src/common/enums';

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  reporter: Types.ObjectId;

  @Prop({ type: String, enum: ReportType, required: true })
  type: ReportType;

  @Prop({ type: Types.ObjectId, required: true })
  target: Types.ObjectId;

  @Prop({ type: String, required: true })
  reason: string;

  @Prop({ type: Boolean, default: false })
  isResolved: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.plugin(mongoosePaginate);