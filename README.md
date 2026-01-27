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
├── pages/              # Next.js page-based routing
│   ├── api/           # API routes
│   ├── _app.tsx       # Custom App component
│   ├── _document.tsx  # Custom Document component
│   ├── index.tsx      # Home page
│   └── apanel44.tsx   # Dashboard page
├── components/        # Reusable React components
│   ├── Button.tsx     # Example button component
│   └── README.md      # Component documentation
├── styles/           # Global styles and Tailwind config
│   └── globals.css   # Global CSS with Tailwind
├── lib/              # Helper functions and utilities
│   ├── prisma.ts     # Prisma client singleton
│   ├── email.ts      # Email utility functions
│   ├── auth.ts       # 2FA authentication utilities
│   ├── console.ts    # Server console management
│   └── README.md     # Library documentation
├── prisma/           # Prisma schema and migrations
│   └── schema.prisma # Database schema
├── public/           # Static assets
└── .env.example      # Environment variable template
```

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

# NextAuth.js - Session encryption
SECRET="generate-a-random-secure-string"
NEXTAUTH_URL="http://localhost:3000"
```

### Generate a secure SECRET

```bash
openssl rand -base64 32
```

## 🔒 Authentication

The panel supports two authentication methods:

1. **Email OTP**: One-time password sent via email
2. **Google Authenticator**: TOTP-based authentication using speakeasy

Both methods can be configured per user for enhanced security.

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
- See the complete `nginx.conf` file in the repository root for the full configuration

### Environment Variables for Production

Update your `.env` file for production:

```env
# Production URL with basePath (note: use trailing slash)
NEXTAUTH_URL="https://v1rtopia.com/apanel44"

# Other environment variables...
DATABASE_URL="mysql://user:password@localhost:3306/smp_admin_panel"
SECRET="your-production-secret-here"
```

### Deployment Checklist

When deploying to production, follow these steps to avoid issues:

1. **Update `next.config.ts`** ✓ Already configured with `trailingSlash: true`
2. **Configure Nginx** using the provided `nginx.conf` file
3. **Build the Next.js application**: `npm run build`
4. **Start the production server**: `npm run start` (or use PM2/systemd)
5. **Test Nginx configuration**: `sudo nginx -t`
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

## 🔒 Authentication

The panel supports two authentication methods:

1. **Email OTP**: One-time password sent via email
2. **Google Authenticator**: TOTP-based authentication using speakeasy

Both methods can be configured per user for enhanced security.

## 📚 API Routes

- `GET /api/health` - Health check endpoint
- More API routes will be added as features are implemented

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

# Push schema changes to database
npx prisma db push

# Create a migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 📖 Documentation

- [Components README](./src/components/README.md) - Component usage and structure
- [Library README](./src/lib/README.md) - Utility functions documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

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
