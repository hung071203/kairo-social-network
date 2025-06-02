import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(data: any) {
    await this.mailerService.sendMail({
      to: data.to,
      from: data.from ?? process.env.MAIL_FROM,
      subject: data.subject,
      template: data.template,
      context: {
        ...data,
        admin: process.env.ADMIN,
        email: process.env.ADMIN_MAIL,
      },
    });
  }
}
