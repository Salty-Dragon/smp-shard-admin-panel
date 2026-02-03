# 🎮 SMP Shard Admin Panel

A comprehensive web-based administration panel for managing Minecraft SMP (Survival Multiplayer) servers. Built with Next.js, TypeScript, and TailwindCSS.

## 🚀 Features

- **Next.js with TypeScript**: Modern React framework with type safety
- **Server-Side Rendering (SSR)**: Fast initial page loads and SEO-friendly
- **TailwindCSS**: Utility-first CSS framework for rapid UI development
- **2FA Authentication**: Two-factor authentication with email OTP or Google Authenticator
- **Database Integration**: Prisma ORM with MariaDB support
- **Server Console Management**: Real-time interaction with Minecraft servers via tmux
- **Email Notifications**: SMTP integration for sending notifications and OTP codes
- **Plugin File Management**: Upload, edit, and manage plugin files with recursive sub-folder navigation

## 📦 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (Pages Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Authentication**: NextAuth.js with speakeasy (TOTP)
- **Database**: Prisma ORM with MariaDB
- **Email**: nodemailer (configured for iRedMail)
- **Password Hashing**: bcryptjs
- **Console Management**: node-pty for tmux integration

## 🌐 Base Path Configuration

This application is configured to run under the `/apanel44` base path. This means:
- All routes are prefixed with `/apanel44` (e.g., `https://v1rtopia.com/apanel44/`)
- Static assets (_next/static/*) are served under `/apanel44/_next/static/`
- The `basePath` is configured in `next.config.ts`

For local development, access the app at `http://localhost:3000/apanel44/`.

### How basePath Works

When you set `basePath: '/apanel44'` in `next.config.ts`:
1. **Pages are NOT in a subdirectory**: Pages are in `/src/pages/`, not `/src/pages/apanel44/`
2. **Next.js handles the prefix**: Next.js automatically adds `/apanel44` to all routes
3. **Links should be relative**: Use `href="/dashboard"`, not `href="/apanel44/dashboard"`
4. **Example mapping**:
   - `/src/pages/index.tsx` → `https://example.com/apanel44/`
   - `/src/pages/login.tsx` → `https://example.com/apanel44/login`
   - `/src/pages/dashboard.tsx` → `https://example.com/apanel44/dashboard`

**Common Mistakes to Avoid:**
- ❌ Using `href="/apanel44/dashboard"` (causes double prefix: `/apanel44/apanel/dashboard`)
- ❌ Putting pages in `/pages/apanel44/` directory (also causes double prefix)
- ✅ Use `href="/dashboard"` (Next.js adds the basePath automatically)
- ✅ Keep pages in `/pages/` directory at root level

### Trailing Slash Configuration

**Important**: This application uses `trailingSlash: true` in `next.config.ts` to ensure all URLs end with a trailing slash. This prevents redirect loops when deploying behind Nginx or other reverse proxies.

**Why this matters:**
- Next.js will automatically append trailing slashes to all routes
- Nginx must be configured to match this behavior to avoid HTTP 308 redirect loops
- Accessing `/apanel44` without a trailing slash will redirect to `/apanel44/`
- All internal navigation will use trailing slashes (e.g., `/apanel44/dashboard/`)

## 📁 Project Structure

```
smp-shard-admin-panel/
├── src/
│   ├── pages/              # Next.js page-based routing
│   │   ├── api/           # API routes
│   │   │   └── auth/      # NextAuth.js authentication API routes
│   │   ├── _app.tsx       # Custom App component (SessionProvider)
│   │   ├── _document.tsx  # Custom Document component
│   │   ├── index.tsx      # Landing page (redirects to dashboard)
│   │   ├── login.tsx      # Login page with 2FA support
│   │   ├── dashboard.tsx  # Main dashboard page
│   │   ├── 2fa-setup.tsx  # 2FA configuration page
│   │   ├── users/         # User management pages
│   │   └── logs/          # Activity log pages
│   ├── components/        # Reusable React components
│   │   └── README.md      # Component documentation
│   ├── styles/           # Global styles and Tailwind config
│   │   └── globals.css   # Global CSS with Tailwind
│   ├── lib/              # Helper functions and utilities
│   │   ├── prisma.ts     # Prisma client singleton
│   │   ├── email.ts      # Email utility functions
│   │   ├── auth.ts       # 2FA authentication utilities
│   │   ├── console.ts    # Server console management
│   │   └── README.md     # Library documentation
│   └── types/            # TypeScript type definitions
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma    # Database schema
├── public/              # Static assets
├── .env.example         # Environment variable template
└── next.config.ts       # Next.js configuration (basePath, trailingSlash)
```

**Important:** All pages are in `/src/pages/` (not `/src/pages/apanel44/`). The `basePath: '/apanel44'` in `next.config.ts` automatically prefixes all routes.

## 🛠️ Installation

### Prerequisites

- Node.js 18+ and npm
- MariaDB database server
- tmux (for server console management)
- SMTP server (iRedMail or similar)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Salty-Dragon/smp-shard-admin-panel.git
   cd smp-shard-admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Update DATABASE_URL in .env with your MariaDB credentials
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000/apanel44](http://localhost:3000/apanel44) to see the dashboard.
   
   **Note**: The application is configured with `basePath: '/apanel44'`, so all routes must be accessed with this prefix.

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure the following:

```env
# Database - MariaDB connection string
DATABASE_URL="mysql://user:password@localhost:3306/smp_admin_panel"

# SMTP Email Configuration
SMTP_HOST="mail.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@example.com"
SMTP_PASS="your-smtp-password"

# NextAuth.js - Session encryption and URL
SECRET="generate-a-random-secure-string"
# IMPORTANT: Include the basePath (/apanel44) in the URL
NEXTAUTH_URL="http://localhost:3000/apanel44"

# Development mode (enables debug logging)
NODE_ENV="development"
```

**Important Notes:**
- The `NEXTAUTH_URL` **must** include the `/apanel44` basePath for authentication to work correctly
- In production, set `NEXTAUTH_URL` to your domain with the basePath (e.g., `https://v1rtopia.com/apanel44`)
- All authentication cookies are scoped to the `/apanel44` path
- Authentication errors will redirect to `/apanel44/login` (not `/api/auth/error`)

### Generate a secure SECRET

```bash
openssl rand -base64 32
```

## 🔒 Authentication

The panel supports two authentication methods:

1. **Email OTP**: One-time password sent via email
2. **Google Authenticator**: TOTP-based authentication using speakeasy

Both methods can be configured per user for enhanced security.

### Authentication Flow & Error Handling

**Login Process:**
1. User enters email and password at `/apanel44/login`
2. If 2FA is enabled, user is prompted for a 2FA code
3. On success, user is redirected to `/apanel44/dashboard`
4. On error, user sees an error message on the login page (no external redirect)

**Cookie Configuration:**
- All NextAuth cookies are scoped to `/apanel44` path
- Cookies: `next-auth.session-token`, `next-auth.callback-url`, `next-auth.csrf-token`
- In production, cookies are set with `secure: true` flag

**Debugging Authentication Issues:**
- Set `NODE_ENV=development` in `.env` to enable NextAuth debug logging
- Check browser console for client-side errors
- Check server console for authentication errors (e.g., invalid credentials, 2FA failures)
- Verify `NEXTAUTH_URL` includes the `/apanel44` basePath

## 🚀 Production Deployment

### Building for Production

1. **Build the Next.js application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm run start
   ```
   
   The app will run on port 3000 by default. You can configure a different port using the `PORT` environment variable.

### Nginx Configuration

When deploying behind Nginx, proper configuration is **critical** to prevent redirect loops. A complete configuration file is provided in `nginx.conf` at the root of this repository.

**Key Configuration Points:**

1. **Trailing Slash Handling**: The app uses `trailingSlash: true` in Next.js, so Nginx must redirect `/apanel44` to `/apanel44/`
2. **Proxy Redirects**: Use `proxy_redirect off;` to let Next.js handle all routing
3. **Static File Caching**: Configure appropriate cache headers for `_next/static/` files
4. **File Upload Size Limit**: Set `client_max_body_size 50M;` to allow plugin file uploads (up to 35MB)

**Quick Setup:**

```bash
# Copy the provided configuration
sudo cp nginx.conf /etc/nginx/sites-available/smp-admin-panel

# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/smp-admin-panel /etc/nginx/sites-enabled/

# Test the configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Sample Configuration (see `nginx.conf` for complete configuration):**

```nginx
# Critical: Redirect base path without trailing slash
location = /apanel44 {
    return 301 /apanel44/;
}

# Main application proxy
location /apanel44/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Allow larger file uploads (for plugin .jar files up to 35MB)
    client_max_body_size 50M;
    
    # CRITICAL: Disable nginx trailing slash redirects
    # Let Next.js handle all routing
    proxy_redirect off;
}

# Static files with aggressive caching
location /apanel44/_next/static/ {
    proxy_pass http://localhost:3000;
    expires 1y;
    add_header Cache-Control "public, immutable";
    proxy_redirect off;
}
```

**Important Notes:**
- Replace `localhost:3000` with your actual Next.js server address and port
- Update `server_name` to match your domain
- For HTTPS, add SSL certificate configuration (see commented section in `nginx.conf`)
- Ensure the `basePath` in `next.config.ts` matches the Nginx location (`/apanel44`)
- **CRITICAL**: The `location = /apanel44` block redirects to `/apanel44/` with a trailing slash - this prevents redirect loops
- **CRITICAL**: Use `proxy_redirect off;` to prevent Nginx from interfering with Next.js routing
- **CRITICAL**: Set `client_max_body_size 50M;` to allow plugin file uploads up to 35MB (without this, you'll get HTTP 413 errors)
- See the complete `nginx.conf` file in the repository root for the full configuration

### Environment Variables for Production

Update your `.env` file for production:

```env
# Production URL with basePath
# IMPORTANT: Include the /apanel44 basePath in the URL for authentication to work
NEXTAUTH_URL="https://v1rtopia.com/apanel44"

# Use production mode to disable debug logging
NODE_ENV="production"

# Other environment variables...
DATABASE_URL="mysql://user:password@localhost:3306/smp_admin_panel"
SECRET="your-production-secret-here"
SMTP_HOST="mail.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@example.com"
SMTP_PASS="your-smtp-password"
LOG_ACCESS_PASSWORD="strong-password-here"
```

**Critical for Authentication:**
- `NEXTAUTH_URL` must include the `/apanel44` basePath
- Without this, authentication will fail and redirect to non-existent error pages
- Trailing slash is optional but should match your Nginx configuration

### Deployment Checklist

When deploying to production, follow these steps to avoid issues:

1. **Update `.env` file** with production values (see above)
2. **Update `next.config.ts`** ✓ Already configured with `trailingSlash: true`
3. **Configure Nginx** using the provided `nginx.conf` file
4. **Build the Next.js application**: `npm run build`
5. **Start the production server**: `npm run start` (or use PM2/systemd)
6. **Test Nginx configuration**: `sudo nginx -t`
6. **Reload Nginx**: `sudo systemctl reload nginx`
7. **Test the deployment**:
   - Access `https://v1rtopia.com/apanel44` (should redirect to `/apanel44/`)
   - Access `https://v1rtopia.com/apanel44/` (should load the app)
   - Check browser console for any errors
   - Verify static files load correctly (check Network tab)

### Troubleshooting

**Problem: "Too Many Redirects" (HTTP 308) error**

This occurs when there's a conflict between Next.js and Nginx trailing slash handling.

**Solution:**
1. Ensure `trailingSlash: true` is set in `next.config.ts` ✓
2. Ensure Nginx configuration includes:
   - `location = /apanel44 { return 301 /apanel44/; }`
   - `proxy_redirect off;` in all proxy_pass blocks
3. Rebuild Next.js: `npm run build`
4. Restart Next.js server and reload Nginx

**Problem: Static files not loading**

**Solution:**
- Verify `location /apanel44/_next/static/` block exists in Nginx config
- Check that `proxy_redirect off;` is set
- Clear browser cache and test in incognito mode

**Problem: 404 errors on sub-routes**

**Solution:**
- Ensure all routes in your app end with trailing slashes
- Verify `basePath: '/apanel44'` is set in `next.config.ts`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

**Problem: Extra `/apanel44/apanel44` in URLs or Authentication Errors**

This happens when the basePath is incorrectly applied twice.

**Root Cause:**
- Pages were in `/src/pages/apanel44/` directory AND `basePath: '/apanel44'` was set
- Links used absolute paths like `href="/apanel44/dashboard"` instead of relative paths

**Solution (Already Fixed):**
- ✅ Pages moved to `/src/pages/` (root level, not in apanel subdirectory)
- ✅ All links updated to use relative paths: `href="/dashboard"` instead of `href="/apanel44/dashboard"`
- ✅ NextAuth `pages.signIn` and `pages.error` correctly set to `${BASE_PATH}/login`
- ✅ All redirects in `getServerSideProps` updated to use relative paths

**Problem: NextAuth API Routes Returning 404**

**Symptoms:**
- `/api/auth/session` returns 404
- `/api/auth/providers` returns 404
- Browser console shows: `Unexpected token '<', "<html>..." is not valid JSON`

**Solution:**
- Verify `/src/pages/api/auth/[...nextauth].ts` exists ✓
- Verify `NEXTAUTH_URL` includes basePath: `http://localhost:3000/apanel44` ✓
- Verify NextAuth cookie paths are set to `BASE_PATH` ✓
- Check that `SessionProvider` is configured in `_app.tsx` ✓

### Authentication & Session Issues

**Problem: Session Not Persisting (Empty `{}` from `/api/auth/session`)**

**Symptoms:**
- Visiting `/apanel44/api/auth/session` returns `{}`
- User is redirected back to login page after successful login
- Sessions are not being created or recognized

**Possible Causes & Solutions:**

1. **Missing or Incorrect `SECRET` Environment Variable**
   - Check if `SECRET` is set: Visit `/apanel44/api/debug/env` (in development mode)
   - Generate a new secret: `openssl rand -base64 32`
   - Add to `.env`: `SECRET="your-generated-secret-here"`
   - Restart the application after updating `.env`

2. **Incorrect `NEXTAUTH_URL`**
   - **CRITICAL**: `NEXTAUTH_URL` must include the basePath `/apanel44`
   - Correct: `NEXTAUTH_URL="http://localhost:3000/apanel44"`
   - Incorrect: `NEXTAUTH_URL="http://localhost:3000"`
   - For production: `NEXTAUTH_URL="https://v1rtopia.com/apanel44"`

3. **Cookie Path Mismatch**
   - All NextAuth cookies are scoped to `/apanel44` path
   - If accessing the app without `/apanel44` prefix, cookies won't work
   - Always access: `http://localhost:3000/apanel44/` (with trailing slash)

4. **Cross-Origin Issues**
   - Ensure you're accessing the app from the same origin as `NEXTAUTH_URL`
   - Example: If `NEXTAUTH_URL="https://v1rtopia.com/apanel44"`, don't access via IP address
   - Check browser DevTools > Application > Cookies to verify cookies are being set

**Problem: Login Redirects Back to Login Page**

**Symptoms:**
- Enter credentials, click Login
- Page redirects back to `/apanel44/login` without error message
- Session is not created

**Debugging Steps:**

1. **Enable Debug Logging**
   - Set `NODE_ENV=development` in `.env`
   - Check server console for detailed authentication logs:
     ```
     [NextAuth] authorize() called
     [NextAuth] Credentials received: { email: 'admin@...', password: '***', ... }
     [NextAuth] User found: { id: '...', email: '...', role: '...' }
     [NextAuth] Password verified successfully
     [NextAuth] Authorization successful
     [NextAuth] jwt() callback called
     [NextAuth] session() callback called
     ```

2. **Check Database Connection**
   - Verify `DATABASE_URL` is correct in `.env`
   - Test database access: `npx prisma studio`
   - Ensure users exist in the database

3. **Check for Authorization Errors**
   - Look for error messages in server console:
     - `[NextAuth] User not found: ...` - Invalid email
     - `[NextAuth] Invalid password for user: ...` - Wrong password
     - `[NextAuth] 2FA code required but not provided` - Missing 2FA code
     - `[NextAuth] Invalid 2FA code` - Wrong 2FA code

4. **Verify Environment Variables**
   - Visit `/apanel44/api/debug/env` (development only)
   - Check that `NEXTAUTH_URL` and `SECRET` are properly set
   - Ensure `DATABASE_URL` shows as `***SET***`

**Problem: 404 on `/api/auth/error`**

**Symptoms:**
- Login fails and tries to redirect to `/api/auth/error` (without basePath)
- Gets 404 error

**Solution:**
- This has been fixed in the NextAuth configuration
- Errors now redirect to `/apanel44/login` instead
- Error messages are displayed on the login page itself

**Problem: Login Successful but Redirected to Wrong Page**

**Symptoms:**
- Login succeeds but redirected to `/dashboard` instead of `/apanel44/dashboard`
- Results in 404 error

**Solution:**
- This has been fixed in the login page
- After successful login, user is redirected to `/apanel44/dashboard`
- All internal navigation uses basePath-aware routes

**Debug Endpoints (Development Only)**

For troubleshooting authentication issues, use these debug endpoints:

1. **Check Environment Variables**: `/apanel44/api/debug/env`
   - Shows which environment variables are set (values masked)
   - Verifies `NEXTAUTH_URL` and `SECRET` configuration
   - **Access Control:**
     - Automatically accessible in development mode (`NODE_ENV=development`)
     - In production, requires `X-Debug-Token` header matching `DEBUG_TOKEN` environment variable
     - Example production usage:
       ```bash
       # Set DEBUG_TOKEN in your .env file
       DEBUG_TOKEN="your-secret-debug-token-here"
       
       # Access the endpoint with the token
       curl -H "X-Debug-Token: your-secret-debug-token-here" https://v1rtopia.com/apanel44/api/debug/env
       ```
   - **Security Note:** Set a strong `DEBUG_TOKEN` in production and keep it secret

2. **Check Session**: `/apanel44/api/auth/session`
   - Returns current session object (empty `{}` if not logged in)
   - After successful login, should return user object with email, name, role

3. **Check Providers**: `/apanel44/api/auth/providers`
   - Lists available authentication providers
   - Should show "Credentials" provider

**Authentication Flow Logging**

When `NODE_ENV=development`, the server logs detailed information about the authentication flow:

```
[NextAuth] authorize() called
[NextAuth] Credentials received: { email: 'admin@...', password: '***', twoFactorCode: 'NOT_PROVIDED' }
[NextAuth] Looking up user: admin@...
[NextAuth] User found: { id: '...', email: '...', name: '...', role: '...', twoFactorEnabled: false }
[NextAuth] Verifying password...
[NextAuth] Password verified successfully
[NextAuth] Updating last login timestamp
[NextAuth] Creating activity log entry
[NextAuth] Authorization successful, returning user: { id: '...', email: '...', name: '...', role: '...' }
[NextAuth] jwt() callback called
[NextAuth] Adding user data to JWT token: { id: '...', role: '...', roleId: '...' }
[NextAuth] session() callback called
[NextAuth] Token data: { id: '...', role: '...', roleId: '...' }
[NextAuth] Session user populated: { id: '...', email: '...', name: '...', role: '...' }
```

Use these logs to identify where the authentication process fails.

## 🔒 Authentication

The panel supports two authentication methods:

1. **Email OTP**: One-time password sent via email
2. **Google Authenticator**: TOTP-based authentication using speakeasy

Both methods can be configured per user for enhanced security.

## 📚 API Routes

All API routes are prefixed with `/apanel44` (the application's basePath):

- `GET /apanel44/api/health` - Health check endpoint
- `GET /apanel44/api/monitoring/metrics` - Server metrics (CPU, memory, player count)
- `GET /apanel44/api/monitoring/server-status` - Minecraft server status and player count
- `GET /apanel44/api/monitoring/history` - Historical metrics data
- More API routes documented in component README files

### File Management API

The file management API allows uploading, editing, and managing plugin files with support for nested directories:

**List Files**
- `GET /apanel44/api/files` - List files in plugin root directory
- `GET /apanel44/api/files?path=subfolder` - List files in a subdirectory
- Returns: Array of file objects with name, size, modified date, isDirectory flag, and extension

**Upload Files**
- `POST /apanel44/api/files` - Upload .jar file to plugin root directory
- `POST /apanel44/api/files` with `path` field in FormData - Upload to subdirectory
- Body: multipart/form-data with `file` field and optional `path` field
- Max size: 35MB
- Allowed types: .jar files only

**Read File Content**
- `GET /apanel44/api/files/[filename]` - Read file from root directory
- `GET /apanel44/api/files/[filename]?path=subfolder` - Read file from subdirectory
- Allowed types: .yml, .yaml, .json, .properties, .txt, .conf, .cfg
- Returns: File content as string

**Edit/Rename File**
- `PUT /apanel44/api/files/[filename]` - Edit or rename file in root directory
- `PUT /apanel44/api/files/[filename]?path=subfolder` - Edit or rename file in subdirectory
- Body (edit): `{ "content": "file content" }`
- Body (rename): `{ "newFilename": "newname.yml" }`

**Delete File**
- `DELETE /apanel44/api/files/[filename]` - Delete file from root directory
- `DELETE /apanel44/api/files/[filename]?path=subfolder` - Delete file from subdirectory

**Security Features:**
- Path traversal prevention (validates all paths stay within plugin directory)
- Filename sanitization (removes dangerous characters)
- Extension whitelisting for uploads and edits
- File size limits (35MB for .jar files)
- Admin authentication required for all operations
- Activity logging for all file operations

## 🎮 Minecraft Server Integration

The panel integrates with Minecraft servers to provide real-time statistics:

### Server Status Monitoring
- **Real-time status**: Online/Offline detection via tmux session checking
- **Player count**: Accurate player count from server console
- **Auto-refresh**: Updates every 10 seconds

### Configuration

Set up your Minecraft server connection in `.env`:

```env
# Minecraft Server Configuration
MINECRAFT_SERVER_SESSION="minecraft-server"
```

This should match the name of the tmux session running your Minecraft server.

### How It Works

1. **Status Check**: Verifies tmux session exists using `tmux has-session`
2. **Player Count**: Sends "list" command to server console
3. **Output Parsing**: Extracts player count from console output
4. **Error Handling**: Returns offline status if session doesn't exist

For detailed information, see [SERVER_STATUS_IMPLEMENTATION.md](./SERVER_STATUS_IMPLEMENTATION.md)

### Troubleshooting

**Server shows as offline but it's running:**
- Verify `MINECRAFT_SERVER_SESSION` matches your actual tmux session name
- Run `tmux ls` to see all session names
- Ensure the Node.js process has permission to check tmux sessions

**Player count always 0:**
- Check server logs to verify "list" command output format
- Increase timeout in `src/lib/minecraft.ts` if server is slow to respond
- Review logs for parsing errors: `[Minecraft] Raw output received...`

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database (recommended for development)
npx prisma db push

# Create a migration (for production deployments)
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Open Prisma Studio (database GUI)
npx prisma studio
```

**Important**: If you encounter error P3005 when running migrations on an existing database, see [MIGRATION_BASELINE_GUIDE.md](./MIGRATION_BASELINE_GUIDE.md) for instructions on how to baseline your database.

For existing production databases, use the baseline script:
```bash
bash scripts/baseline-migration.sh
```

## 📖 Documentation

### Setup and Configuration
- [TESTING_DEPLOYMENT_GUIDE.md](./TESTING_DEPLOYMENT_GUIDE.md) - Complete setup and deployment guide
- [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) - Authentication and 2FA configuration
- [MIGRATION_BASELINE_GUIDE.md](./MIGRATION_BASELINE_GUIDE.md) - How to handle migrations on existing databases (P3005 error fix)

### Features and Usage
- [HISTORICAL_DATA_VISUALIZATION_GUIDE.md](./HISTORICAL_DATA_VISUALIZATION_GUIDE.md) - Historical metrics visualization and automatic data collection
- [SERVER_STATUS_IMPLEMENTATION.md](./SERVER_STATUS_IMPLEMENTATION.md) - Server status monitoring features

### Code Documentation
- [Components README](./src/components/README.md) - Component usage and structure
- [Library README](./src/lib/README.md) - Utility functions documentation

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/) - Chart library for data visualization

## 🔐 Security

- Passwords are hashed using bcryptjs
- 2FA support via email OTP or TOTP (Google Authenticator)
- Session management via NextAuth.js
- Environment variables for sensitive configuration

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Database with [Prisma](https://www.prisma.io/)
- Authentication with [NextAuth.js](https://next-auth.js.org/)

---

**Note**: This is the initial setup and foundational structure. Additional features will be implemented in future updates.
