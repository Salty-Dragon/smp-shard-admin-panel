/**
 * Email Utility Functions
 * Uses nodemailer to send emails via SMTP (iRedMail)
 * 
 * This module provides functions for:
 * - Sending OTP codes for 2FA authentication
 * - General email notifications
 */

import nodemailer from 'nodemailer';

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

/**
 * Create a reusable transporter object using SMTP
 */
export const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};

/**
 * Send an OTP (One-Time Password) email for 2FA authentication
 * 
 * @param to - Recipient email address
 * @param otp - One-time password code
 * @returns Promise<boolean> - True if email was sent successfully
 */
export async function sendOTPEmail(to: string, otp: string): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@example.com',
      to,
      subject: 'SMP Admin Panel - Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SMP Admin Panel - Authentication</h2>
          <p>Your One-Time Password (OTP) for authentication is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="color: #666; font-size: 12px;">SMP Admin Panel - Server Management System</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
}

/**
 * Send a general notification email
 * 
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email body (HTML)
 * @returns Promise<boolean> - True if email was sent successfully
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@example.com',
      to,
      subject: `SMP Admin Panel - ${subject}`,
      html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}
