/**
 * API endpoint to enable 2FA
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { verifyTOTPToken, verifyEmailOTP } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.user.id;
    const { method, code } = req.body;

    if (!method || !code) {
      return res.status(400).json({ error: 'Method and code required' });
    }

    if (method !== 'email' && method !== 'totp') {
      return res.status(400).json({ error: 'Invalid method' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify code
    let isValid = false;

    if (method === 'totp' && user.totpSecret) {
      isValid = verifyTOTPToken(code, user.totpSecret);
    } else if (method === 'email' && user.emailOTP) {
      // Check expiry
      if (user.emailOTPExpiry && user.emailOTPExpiry < new Date()) {
        return res.status(400).json({ error: 'OTP expired' });
      }
      isValid = verifyEmailOTP(code, user.emailOTP);
    } else {
      return res.status(400).json({ error: 'Setup not completed' });
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: method,
        // Clear email OTP if enabled via email
        ...(method === 'email' && {
          emailOTP: null,
          emailOTPExpiry: null,
        }),
      },
    });

    // Log activity
    await logActivity({
      userId,
      actionType: 'update_user',
      resource: 'user',
      resourceId: userId,
      details: { action: 'enable_2fa', method },
      req,
    });

    return res.status(200).json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);
