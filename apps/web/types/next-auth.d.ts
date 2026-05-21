import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }

  interface User {
    role?: string;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    accessToken?: string;
  }
}
