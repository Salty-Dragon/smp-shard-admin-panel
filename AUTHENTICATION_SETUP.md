# Authentication & RBAC Setup Guide

This guide walks you through setting up the authentication and role-based access control system for the SMP Admin Panel.

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ installed
- MariaDB/MySQL database server running
- SMTP server access (for email OTP)
- Git installed

## Step 1: Database Setup

### 1.1 Create Database

Connect to your MariaDB/MySQL server and create the database:

```sql
CREATE DATABASE smp_admin_panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.2 Configure Environment Variables

Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env
```

Edit `.env` and update the following variables:

```env
# Database Configuration
DATABASE_URL="mysql://username:password@localhost:3306/smp_admin_panel"

# SMTP Email Configuration  
SMTP_HOST="mail.yourdomain.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="your-smtp-password"

# NextAuth.js Configuration
SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000/apanel"
```

Generate a secure secret for NextAuth.js:

```bash
openssl rand -base64 32
```

### 1.3 Run Database Migrations

Generate the Prisma client and push the schema to your database:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

### 1.4 Seed Initial Data

Run the database seeder to create roles, permissions, and a default Super Admin user:

```bash
npx ts-node prisma/seed.ts
```

This creates:
- **Roles**: Super Admin, Admin, Moderator
- **Permissions**: Appropriate permissions for each role
- **Default Super Admin**:
  - Email: `admin@smp-panel.local`
  - Password: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Development Server

Start the development server:

```bash
npm run dev
```

Access the application at: `http://localhost:3000/apanel/login`

## Step 4: First Login

1. Navigate to `http://localhost:3000/apanel/login`
2. Login with default credentials:
   - Email: `admin@smp-panel.local`
   - Password: `admin123`
3. You'll be redirected to the dashboard

## Step 5: Setup 2FA (Recommended)

After logging in, navigate to the 2FA Setup page:

1. Click on "🔐 2FA Setup" in the navigation
2. Choose your preferred method:
   - **Email OTP**: Receive codes via email
   - **Google Authenticator**: Use an authenticator app
3. Follow the setup wizard
4. Verify your 2FA code

## Step 6: Create Additional Users

As a Super Admin, you can create additional users:

1. Navigate to "👥 Users" in the navigation
2. Click "Create User"
3. Fill in the user details:
   - Name
   - Email
   - Password
   - Role (Super Admin, Admin, or Moderator)
4. Click "Create"

## Role Permissions

### Super Admin
- ✅ Full access to all features
- ✅ User management (create, edit, delete)
- ✅ Role and permission management
- ✅ View activity logs (with password protection)
- ✅ Access to all dashboard features

### Admin
- ✅ Dashboard access (read/write)
- ✅ Server management (read/write/manage)
- ✅ View users (read-only)
- ❌ Cannot modify roles or permissions
- ❌ Cannot view detailed activity logs

### Moderator
- ✅ Dashboard access (read-only)
- ✅ View activity logs (read-only)
- ✅ View server status (read-only)
- ❌ Cannot modify anything
- ❌ Cannot manage users or roles

## Features Overview

### Authentication
- ✅ Email/password login
- ✅ Two-factor authentication (2FA)
  - Email OTP
  - Google Authenticator (TOTP)
- ✅ Session management with HttpOnly cookies
- ✅ Automatic session expiration (24 hours)

### User Management
- ✅ Create, edit, and delete users
- ✅ Assign roles to users
- ✅ View user activity and login history
- ✅ Force password resets

### Activity Logging
- ✅ All user actions are logged
- ✅ Logs include:
  - Action type (login, logout, create user, etc.)
  - User who performed the action
  - Timestamp
  - IP address
  - User agent
  - Additional details
- ✅ Filterable by:
  - Time range (last hour, 24 hours, week, all time)
  - Action type
  - User
- ✅ Password-protected access for Super Admins

### Recent Actions Feed
- ✅ Dashboard displays last 24 hours of activity
- ✅ Real-time updates
- ✅ Quick overview of panel usage

## Security Best Practices

1. **Change Default Password**
   - Immediately change the default Super Admin password after first login

2. **Enable 2FA**
   - Require all users to enable 2FA
   - Use Google Authenticator for better security

3. **Secure Environment Variables**
   - Never commit `.env` file to version control
   - Use strong, unique passwords
   - Generate a new SECRET key for production

4. **Database Security**
   - Use strong database passwords
   - Restrict database access to localhost or specific IPs
   - Enable SSL/TLS for database connections

5. **SMTP Security**
   - Use authenticated SMTP
   - Enable TLS/SSL for email connections
   - Use a dedicated email address for notifications

6. **Regular Audits**
   - Regularly review activity logs
   - Remove inactive users
   - Update passwords periodically

## Troubleshooting

### Cannot Login
- Verify database connection
- Check that seed script ran successfully
- Ensure SECRET is set in `.env`
- Verify NEXTAUTH_URL matches your deployment

### Email OTP Not Sending
- Check SMTP credentials in `.env`
- Verify SMTP server allows connections
- Check spam folder
- Review application logs for errors

### 2FA Code Invalid
- Ensure system time is synchronized (for TOTP)
- Verify code hasn't expired (10 minutes for email OTP)
- Try generating a new code

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Run `npx prisma generate` to regenerate Prisma client
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

## Production Deployment

### Environment Variables

Update `.env` for production:

```env
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com/apanel"
DATABASE_URL="mysql://username:password@localhost:3306/smp_admin_panel"
```

### Build Application

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Using Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "smp-admin-panel" -- start

# Save PM2 configuration
pm2 save

# Enable PM2 on system startup
pm2 startup
```

### Nginx Configuration

Refer to the `nginx.conf` file in the repository root for complete Nginx configuration.

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints
- `POST /api/auth/request-otp` - Request email OTP
- `POST /api/auth/setup-totp` - Setup Google Authenticator
- `POST /api/auth/enable-2fa` - Enable 2FA

### User Management
- `GET /api/users` - List all users (Super Admin only)
- `POST /api/users` - Create new user (Super Admin only)
- `PUT /api/users/[id]` - Update user (Super Admin only)
- `DELETE /api/users/[id]` - Delete user (Super Admin only)

### Role Management
- `GET /api/roles` - List all roles with permissions (Super Admin only)
- `PUT /api/roles/[id]` - Update role permissions (Super Admin only)

### Activity Logs
- `GET /api/logs` - Get activity logs with filters (requires permission)
- `GET /api/logs/recent` - Get recent activity (last 24 hours)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs
3. Consult the main README.md
4. Contact your system administrator

## License

This project is proprietary. See LICENSE for details.
