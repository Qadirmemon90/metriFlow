import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  public sentMessages: EmailMessage[] = []; // In-memory store for tests

  constructor() {
    if (config.EMAIL_ADAPTER === 'smtp' && config.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT || 587,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
    }
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    this.sentMessages.push(message);

    if (config.EMAIL_ADAPTER === 'console' || config.EMAIL_ADAPTER === 'memory') {
      console.log(`[Email Mock (${config.EMAIL_ADAPTER})] To: ${message.to} | Subject: ${message.subject}`);
      return;
    }

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: config.SMTP_FROM,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });
      } catch (error) {
        console.error('[EmailService] Failed to send email via SMTP:', error);
        throw error;
      }
    }
  }

  async sendVerificationEmail(to: string, fullName: string, token: string): Promise<void> {
    const link = `${config.CLIENT_URL}/verify-email?token=${token}`;
    await this.sendEmail({
      to,
      subject: 'Verify your MetriFlow Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #102A43;">Welcome to MetriFlow, ${fullName}!</h2>
          <p>Please click the button below to verify your email address and activate your organization account:</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email Address
            </a>
          </p>
          <p style="color: #627D98; font-size: 14px;">This link will expire in 24 hours. If you did not sign up for MetriFlow, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${config.CLIENT_URL}/reset-password?token=${token}`;
    await this.sendEmail({
      to,
      subject: 'Reset your MetriFlow Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #102A43;">Password Reset Request</h2>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background-color: #102A43; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p style="color: #627D98; font-size: 14px;">This link will expire in 15 minutes. If you did not make this request, your account is secure and you can ignore this email.</p>
        </div>
      `,
    });
  }

  async sendInvitationEmail(to: string, inviterName: string, orgName: string, token: string): Promise<void> {
    const link = `${config.CLIENT_URL}/accept-invitation?token=${token}`;
    await this.sendEmail({
      to,
      subject: `You have been invited to join ${orgName} on MetriFlow`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #102A43;">Team Invitation</h2>
          <p>${inviterName} has invited you to join the team for <strong>${orgName}</strong> on MetriFlow.</p>
          <p style="margin: 24px 0;">
            <a href="${link}" style="background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accept Invitation & Set Password
            </a>
          </p>
          <p style="color: #627D98; font-size: 14px;">This invitation link will expire in 7 days.</p>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
