# Library Functions

This directory contains utility functions and helper modules for the SMP Admin Panel.

## Modules

### `prisma.ts`
- **Purpose**: Provides a singleton instance of PrismaClient for database operations
- **Usage**: Import this instead of creating new PrismaClient instances
- **Features**: Prevents multiple database connections during development hot-reload

### `email.ts`
- **Purpose**: Email functionality using nodemailer
- **Features**:
  - Send OTP codes for 2FA authentication
  - Send notification emails
  - Configured for iRedMail SMTP server
- **Configuration**: Requires SMTP environment variables in `.env`

### `auth.ts`
- **Purpose**: Two-Factor Authentication (2FA) utilities
- **Features**:
  - Generate TOTP secrets for Google Authenticator
  - Generate QR codes for easy setup
  - Verify TOTP tokens
  - Generate and verify email-based OTP codes
- **Compatible with**: Google Authenticator, Authy, and other TOTP apps

### `console.ts`
- **Purpose**: Server console management using node-pty and tmux
- **Features**:
  - Create tmux sessions for Minecraft servers
  - Send commands to server console
  - Read console output in real-time
  - Manage multiple server instances
- **Requirements**: tmux must be installed on the system

## Usage Examples

### Database Operations
```typescript
import prisma from '@/lib/prisma';

const users = await prisma.user.findMany();
```

### Sending 2FA Email
```typescript
import { sendOTPEmail } from '@/lib/email';

await sendOTPEmail('user@example.com', '123456');
```

### Setting up Google Authenticator
```typescript
import { generateTOTPSecret, generateQRCode } from '@/lib/auth';

const { secret, otpAuthUrl } = generateTOTPSecret('username');
const qrCode = await generateQRCode(otpAuthUrl);
```

### Managing Server Console
```typescript
import { createServerSession, sendCommand } from '@/lib/console';

await createServerSession('server1', '/path/to/server');
sendCommand('server1', 'say Hello, world!');
```
