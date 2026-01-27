/**
 * API endpoint to request email OTP for 2FA
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { generateEmailOTP } from '@/lib/auth';
import { sendOTPEmail } from '@/lib/email';
import prisma from '@/lib/prisma';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user.id;

    // Generate OTP
    const otp = generateEmailOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emailOTP: otp,
        emailOTPExpiry: expiry,
      },
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(user.email, otp);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      expiresAt: expiry.toISOString(),
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
