# Authentication & Session Fix Summary

This document summarizes the changes made to fix authentication and session persistence issues in the SMP Admin Panel.

## Issues Fixed

### 1. Session Not Persisting
**Problem:** `/apanel44/api/auth/session` was returning empty `{}` after login.

**Root Causes:**
- Missing or incorrect `SECRET` environment variable
- Incorrect `NEXTAUTH_URL` (missing `/apanel44` basePath)
- Cookie path mismatches
- Cross-origin issues

**Solution:**
- Added extensive debugging to track session creation
- Created `/api/debug/env` endpoint to verify environment variables
- Updated documentation with troubleshooting steps

### 2. Login Redirect Issues
**Problem:** After successful login, users were redirected to incorrect URLs or got 404 errors.

**Root Causes:**
- Misunderstanding of how Next.js basePath works
- Incorrect use of basePath in client-side redirects

**Solution:**
- Fixed client-side redirects to use relative paths (e.g., `/dashboard` instead of `/apanel44/dashboard`)
- Next.js automatically prepends the basePath from `next.config.ts`
- Updated all redirects to be basePath-aware

### 3. Error Handling Issues
**Problem:** Login errors were redirecting to `/api/auth/error` (404) instead of showing on login page.

**Status:** Already fixed in NextAuth configuration
- Errors redirect to `/apanel44/login` instead
- Error messages display on the login page itself

### 4. Lack of Debugging Information
**Problem:** Difficult to diagnose authentication issues in production.

**Solution:**
- Added detailed logging in development mode
- Logs track entire authentication flow:
  - Credential validation
  - User lookup
  - Password verification
  - 2FA verification
  - JWT token creation
  - Session population
- Protected sensitive data in production (only logs in dev mode)

## New Features

### Debug Endpoint: `/api/debug/env`
Helps verify environment variable configuration.

**Development Access:**
```bash
# Automatically accessible in development mode
curl http://localhost:3000/apanel44/api/debug/env
```

**Production Access:**
```bash
# Requires DEBUG_TOKEN environment variable and header
curl -H "X-Debug-Token: your-secret-token" https://v1rtopia.com/apanel44/api/debug/env
```

**Returns:**
```json
{
  "message": "Environment variables status",
  "env": {
    "NEXTAUTH_URL": "http://localhost:3000/apanel44",
    "SECRET": "***SET***",
    "SECRET_LENGTH": 43,
    "NODE_ENV": "development",
    "DATABASE_URL": "***SET***",
    "SMTP_HOST": "mail.example.com",
    "SMTP_PORT": "587",
    "SMTP_USER": "***SET***",
    "SMTP_PASS": "***SET***"
  },
  "timestamp": "2024-01-27T19:47:02.951Z"
}
```

## Environment Variables

### Required Variables
```bash
# Database connection
DATABASE_URL="mysql://user:password@localhost:3306/smp_admin_panel"

# NextAuth configuration
# CRITICAL: Must include /apanel44 basePath
NEXTAUTH_URL="http://localhost:3000/apanel44"  # or https://v1rtopia.com/apanel44 in production
SECRET="generate-with-openssl-rand-base64-32"

# SMTP for 2FA email codes
SMTP_HOST="mail.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@example.com"
SMTP_PASS="your-smtp-password"

# Log access password
LOG_ACCESS_PASSWORD="strong-password"

# Optional: Debug token for production debugging
# DEBUG_TOKEN="generate-with-openssl-rand-base64-32"
```

### Generate Secure Secrets
```bash
# Generate SECRET or DEBUG_TOKEN
openssl rand -base64 32
```

## Authentication Flow (Development Mode)

When a user logs in, you'll see detailed logs:

```
[NextAuth] authorize() called
[NextAuth] Credentials received: { email: 'admin@...', password: '***', twoFactorCode: 'NOT_PROVIDED' }
[NextAuth] Looking up user: admin@example.com
[NextAuth] User found: { id: '...', email: '...', name: '...', role: 'Super Admin', twoFactorEnabled: false }
[NextAuth] Verifying password...
[NextAuth] Password verified successfully
[NextAuth] Updating last login timestamp
[NextAuth] Creating activity log entry
[NextAuth] Authorization successful, returning user: { id: '...', email: '...', name: '...', role: 'Super Admin' }
[NextAuth] jwt() callback called
[NextAuth] Adding user data to JWT token: { id: '...', role: 'Super Admin', roleId: '...' }
[NextAuth] session() callback called
[NextAuth] Token data: { id: '...', role: 'Super Admin', roleId: '...' }
[NextAuth] Session user populated: { id: '...', email: '...', name: '...', role: 'Super Admin' }
```

**Note:** In production mode, detailed logging is disabled to protect user privacy.

## Testing Checklist

Before deploying, verify:

- [ ] Environment variables are set correctly
  - Visit `/apanel44/api/debug/env` to verify
  - Check `NEXTAUTH_URL` includes `/apanel44`
  - Check `SECRET` is set and has sufficient length (>= 32 chars)

- [ ] Database is accessible
  - Run `npx prisma studio` to verify connection
  - Ensure users exist in the database

- [ ] SMTP is configured (if using email 2FA)
  - Test sending an email from your SMTP server

- [ ] Build succeeds
  - Run `npm run build`
  - Check for any TypeScript or build errors

- [ ] Login flow works
  - Navigate to `/apanel44/login`
  - Enter valid credentials
  - Verify redirect to `/apanel44/dashboard`
  - Check browser cookies (should see `next-auth.session-token`)

- [ ] Session persists
  - After login, visit `/apanel44/api/auth/session`
  - Should return user object with email, name, role
  - Should NOT return empty `{}`

- [ ] Logout works
  - Click logout button
  - Should redirect to `/apanel44/login`
  - Session should be cleared

## Common Issues & Solutions

### Issue: "Invalid credentials" but password is correct
**Check:**
- Database connection is working
- User exists in database with correct email
- Password hash in database is valid (bcrypt format)

**Debug:**
- Enable development mode: `NODE_ENV=development`
- Check server logs for "[NextAuth] User not found" or "[NextAuth] Invalid password"

### Issue: Empty `{}` from `/api/auth/session`
**Check:**
- `NEXTAUTH_URL` includes `/apanel44` basePath
- `SECRET` environment variable is set
- Cookies are being set in browser (DevTools > Application > Cookies)
- Accessing app from same origin as `NEXTAUTH_URL`

**Debug:**
- Visit `/apanel44/api/debug/env`
- Check that `NEXTAUTH_URL` and `SECRET` show as `***SET***`
- Check browser cookies for `next-auth.session-token` with path `/apanel44`

### Issue: Redirect loop or 404 after login
**Check:**
- `basePath: '/apanel44'` is set in `next.config.ts`
- Not manually prepending `/apanel44` in redirects
- `trailingSlash: true` is set in `next.config.ts`

**Solution:**
- Use relative paths in redirects: `/dashboard` not `/apanel44/dashboard`
- Next.js handles basePath automatically

### Issue: CORS or cross-origin errors
**Check:**
- Accessing app from URL that matches `NEXTAUTH_URL`
- Not mixing http/https
- Not mixing domain names (e.g., v1rtopia.com vs www.v1rtopia.com)

**Solution:**
- Ensure `NEXTAUTH_URL` exactly matches the URL used to access the app

## Security Notes

1. **Logging in Production:**
   - Detailed auth logs are DISABLED in production to protect user privacy
   - Only error messages are logged
   - Sensitive data (emails, names) are never logged in production

2. **Debug Endpoint:**
   - Requires `DEBUG_TOKEN` in production
   - All sensitive values are masked
   - Consider adding rate limiting if exposed publicly

3. **Secrets:**
   - Use strong, random values for `SECRET` and `DEBUG_TOKEN`
   - Generate with: `openssl rand -base64 32`
   - Never commit secrets to version control

4. **2FA:**
   - TOTP secrets are encrypted in database
   - Email OTPs expire after 10 minutes
   - OTPs are cleared after successful verification

## Files Changed

1. **`src/pages/api/auth/[...nextauth].ts`**
   - Added extensive debugging (development only)
   - Protected sensitive data in production
   - Improved error messages

2. **`src/pages/login.tsx`**
   - Fixed redirect to use relative path

3. **`src/pages/dashboard.tsx`**
   - Fixed logout callback to use relative path

4. **`src/pages/api/debug/env.ts`** (NEW)
   - Environment variable validation endpoint
   - Helps diagnose configuration issues

5. **`.env.example`**
   - Added `DEBUG_TOKEN` documentation

6. **`README.md`**
   - Added comprehensive troubleshooting section
   - Documented authentication flow
   - Added debug endpoint usage guide

## Next Steps

For deployment:

1. **Set up `.env` file** with all required variables
2. **Run database migrations**: `npx prisma db push`
3. **Build the application**: `npm run build`
4. **Start production server**: `npm run start`
5. **Configure Nginx** (see README for complete config)
6. **Test login flow** end-to-end
7. **Monitor logs** for any issues

For troubleshooting:
- Enable development mode: `NODE_ENV=development`
- Check environment variables: `/apanel44/api/debug/env`
- Review server logs for detailed authentication flow
- Check browser DevTools for client-side errors and cookies

## Support

If you encounter issues:

1. Check this document for common issues
2. Review the troubleshooting section in README.md
3. Enable development mode and check server logs
4. Use the debug endpoint to verify configuration
5. Check browser console and network tab for client-side errors
