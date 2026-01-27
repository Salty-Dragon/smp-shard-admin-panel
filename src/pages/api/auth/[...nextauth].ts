/**
 * NextAuth.js Configuration
 * Handles authentication with email/password and 2FA
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

// Base path for the application - must match next.config.ts basePath
const BASE_PATH = '/apanel44';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        console.log('[NextAuth] authorize() called');
        console.log('[NextAuth] Credentials received:', {
          email: credentials?.email || 'MISSING',
          password: credentials?.password ? '***' : 'MISSING',
          twoFactorCode: credentials?.twoFactorCode ? '***' : 'NOT_PROVIDED',
        });

        if (!credentials?.email || !credentials?.password) {
          console.error('[NextAuth] Missing email or password');
          throw new Error('Email and password required');
        }

        // Find user by email
        console.log('[NextAuth] Looking up user:', credentials.email);
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (!user) {
          console.error('[NextAuth] User not found:', credentials.email);
          throw new Error('Invalid credentials');
        }

        console.log('[NextAuth] User found:', {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorMethod: user.twoFactorMethod || 'NONE',
        });

        // Verify password
        console.log('[NextAuth] Verifying password...');
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          console.error('[NextAuth] Invalid password for user:', credentials.email);
          throw new Error('Invalid credentials');
        }

        console.log('[NextAuth] Password verified successfully');

        // If 2FA is enabled, verify the code
        if (user.twoFactorEnabled) {
          console.log('[NextAuth] 2FA enabled for user, method:', user.twoFactorMethod);
          
          if (!credentials.twoFactorCode) {
            console.error('[NextAuth] 2FA code required but not provided');
            throw new Error('2FA code required');
          }

          console.log('[NextAuth] Verifying 2FA code...');

          // Verify 2FA code based on method
          const { verifyTOTPToken, verifyEmailOTP } = await import('@/lib/auth');
          
          let isValid2FA = false;
          
          if (user.twoFactorMethod === 'totp' && user.totpSecret) {
            console.log('[NextAuth] Verifying TOTP code');
            isValid2FA = verifyTOTPToken(credentials.twoFactorCode, user.totpSecret);
            console.log('[NextAuth] TOTP verification result:', isValid2FA);
          } else if (user.twoFactorMethod === 'email' && user.emailOTP) {
            console.log('[NextAuth] Verifying email OTP');
            // Check if OTP is expired
            if (user.emailOTPExpiry && user.emailOTPExpiry < new Date()) {
              console.error('[NextAuth] Email OTP expired');
              throw new Error('OTP expired. Please request a new one.');
            }
            isValid2FA = verifyEmailOTP(credentials.twoFactorCode, user.emailOTP);
            console.log('[NextAuth] Email OTP verification result:', isValid2FA);
          }

          if (!isValid2FA) {
            console.error('[NextAuth] Invalid 2FA code');
            throw new Error('Invalid 2FA code');
          }

          console.log('[NextAuth] 2FA verification successful');

          // Clear email OTP after successful verification
          if (user.twoFactorMethod === 'email') {
            await prisma.user.update({
              where: { id: user.id },
              data: { emailOTP: null, emailOTPExpiry: null },
            });
            console.log('[NextAuth] Email OTP cleared');
          }
        }

        // Update last login
        console.log('[NextAuth] Updating last login timestamp');
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Log the login action
        console.log('[NextAuth] Creating activity log entry');
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            actionType: 'login',
            resource: 'auth',
            details: JSON.stringify({ method: 'credentials' }),
          },
        });

        const userResult = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          roleId: user.roleId,
        };

        console.log('[NextAuth] Authorization successful, returning user:', {
          id: userResult.id,
          email: userResult.email,
          name: userResult.name,
          role: userResult.role,
        });

        return userResult;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('[NextAuth] jwt() callback called');
      if (user) {
        console.log('[NextAuth] Adding user data to JWT token:', {
          id: user.id,
          role: user.role,
          roleId: user.roleId,
        });
        token.id = user.id;
        token.role = user.role;
        token.roleId = user.roleId;
      } else {
        console.log('[NextAuth] JWT refresh - existing token:', {
          id: token.id,
          role: token.role,
          roleId: token.roleId,
        });
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth] session() callback called');
      console.log('[NextAuth] Token data:', {
        id: token.id,
        role: token.role,
        roleId: token.roleId,
      });
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roleId = token.roleId as string;
        console.log('[NextAuth] Session user populated:', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        });
      }
      return session;
    },
  },
  pages: {
    signIn: `${BASE_PATH}/login`,
    error: `${BASE_PATH}/login`,
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: BASE_PATH,
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: BASE_PATH,
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: BASE_PATH,
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.SECRET || 'dev-secret-change-in-production',
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
