import 'express';

declare module 'express' {
  interface Request {
    session: Session & Partial<SessionData>; // Mở rộng Request để có session
  }
}
