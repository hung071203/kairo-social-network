import { UserRole } from './app.enum';

export enum ReportType {
  USER = 'USER',
  POST = 'POST',
}

export enum NotificationType {
  FOLLOW = 'FOLLOW',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  SYSTEM = 'SYSTEM',
  POST = 'POST',
  REPORT = 'REPORT',
  USER = 'USER',
}

export enum SystemNotificationRecipientEnum {
  USER = UserRole.USER,
  MOD = UserRole.MOD,
  ADMIN = UserRole.ADMIN,
}

export enum PostTypeEnum {
  FOLLOWERS = 'FOLLOWERS',
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum MessageTypeEnum {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
}

export enum SenderTypeEnum {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}
