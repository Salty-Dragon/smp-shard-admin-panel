/**
 * Type definitions for NextAuth
 * Extends the default types to include our custom fields
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      roleId: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    roleId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    roleId: string;
  }
}
