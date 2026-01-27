/**
 * API endpoint to setup TOTP (Google Authenticator) for 2FA
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { generateTOTPSecret, generateQRCode } from '@/lib/auth';
import prisma from '@/lib/prisma';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Generate new TOTP secret
    try {
      const userId = req.user.id;
      const userName = req.user.name;

      // Generate TOTP secret
      const { secret, otpAuthUrl } = generateTOTPSecret(userName);

      // Generate QR code
      const qrCode = await generateQRCode(otpAuthUrl);

      // Store secret temporarily (not yet activated)
      await prisma.user.update({
        where: { id: userId },
        data: {
          totpSecret: secret,
        },
      });

      return res.status(200).json({
        success: true,
        secret,
        qrCode,
      });
    } catch (error) {
      console.error('Error setting up TOTP:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
