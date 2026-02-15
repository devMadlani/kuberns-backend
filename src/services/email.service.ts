import nodemailer, { Transporter } from 'nodemailer';

import {
  MAIL_ENABLED,
  MAIL_FROM,
  NODE_ENV,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
} from '../config/env';
import { ApiError } from '../utils/ApiError';

export class EmailService {
  private readonly transporter: Transporter | null;
  private readonly enabled: boolean;

  constructor() {
    this.enabled = MAIL_ENABLED || NODE_ENV === 'production';

    if (!this.enabled) {
      this.transporter = null;
      return;
    }

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
      throw new Error(
        'SMTP is enabled but SMTP_HOST/SMTP_USER/SMTP_PASS/MAIL_FROM are not configured',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  public async sendOtpEmail(email: string, otp: string): Promise<void> {
    if (!this.enabled || !this.transporter || !MAIL_FROM) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: MAIL_FROM,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your OTP code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
      });
    } catch (_error) {
      throw new ApiError(502, 'Failed to send OTP email');
    }
  }
}
