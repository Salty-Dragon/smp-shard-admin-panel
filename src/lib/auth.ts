/**
 * Two-Factor Authentication (2FA) Utilities
 * Uses speakeasy for generating TOTP tokens (Google Authenticator compatible)
 * 
 * This module provides functions for:
 * - Generating TOTP secrets
 * - Generating QR codes for Google Authenticator
 * - Verifying TOTP tokens
 * - Generating one-time codes for email-based 2FA
 */

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

/**
 * Generate a new TOTP secret for a user
 * This secret is used for Google Authenticator setup
 * 
 * @param userName - User's name or identifier
 * @param issuer - Application name (default: SMP Admin Panel)
 * @returns Object containing the secret and otpauth URL
 */
export function generateTOTPSecret(userName: string, issuer = 'SMP Admin Panel') {
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${userName})`,
    issuer: issuer,
    length: 32,
  });

  return {
    secret: secret.base32,
    otpAuthUrl: secret.otpauth_url || '',
  };
}

/**
 * Generate a QR code for TOTP setup
 * Users can scan this with Google Authenticator
 * 
 * @param otpAuthUrl - The otpauth:// URL from generateTOTPSecret
 * @returns Promise<string> - Data URL of the QR code image
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP token against a secret
 * 
 * @param token - 6-digit token from user's authenticator app
 * @param secret - User's TOTP secret (base32)
 * @param window - Time window for token validation (default: 1 = ±30 seconds)
 * @returns boolean - True if token is valid
 */
export function verifyTOTPToken(
  token: string,
  secret: string,
  window = 1
): boolean {
  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window,
    });

    return verified;
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return false;
  }
}

/**
 * Generate a random 6-digit OTP code for email-based 2FA
 * This is an alternative to TOTP for users who prefer email-based authentication
 * 
 * @returns string - 6-digit OTP code
 */
export function generateEmailOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verify an email OTP code
 * Note: You should implement expiration logic in your database
 * 
 * @param providedCode - Code entered by user
 * @param storedCode - Code stored in database
 * @returns boolean - True if codes match
 */
export function verifyEmailOTP(providedCode: string, storedCode: string): boolean {
  return providedCode === storedCode;
}
