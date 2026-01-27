/**
 * NextAuth.js Configuration
 * Handles authentication with email/password and 2FA
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        // If 2FA is enabled, verify the code
        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode) {
            throw new Error('2FA code required');
          }

          // Verify 2FA code based on method
          const { verifyTOTPToken, verifyEmailOTP } = await import('@/lib/auth');
          
          let isValid2FA = false;
          
          if (user.twoFactorMethod === 'totp' && user.totpSecret) {
            isValid2FA = verifyTOTPToken(credentials.twoFactorCode, user.totpSecret);
          } else if (user.twoFactorMethod === 'email' && user.emailOTP) {
            // Check if OTP is expired
            if (user.emailOTPExpiry && user.emailOTPExpiry < new Date()) {
              throw new Error('OTP expired. Please request a new one.');
            }
            isValid2FA = verifyEmailOTP(credentials.twoFactorCode, user.emailOTP);
          }

          if (!isValid2FA) {
            throw new Error('Invalid 2FA code');
          }

          // Clear email OTP after successful verification
          if (user.twoFactorMethod === 'email') {
            await prisma.user.update({
              where: { id: user.id },
              data: { emailOTP: null, emailOTPExpiry: null },
            });
          }
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Log the login action
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            actionType: 'login',
            resource: 'auth',
            details: JSON.stringify({ method: 'credentials' }),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          roleId: user.roleId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.roleId = user.roleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.roleId = token.roleId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/apanel44/login',
    error: '/apanel44/login',
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
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.SECRET || 'dev-secret-change-in-production',
};

export default NextAuth(authOptions);
