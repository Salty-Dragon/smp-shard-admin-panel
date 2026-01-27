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

- [Components README](./components/README.md) - Component usage and structure
- [Library README](./lib/README.md) - Utility functions documentation
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
