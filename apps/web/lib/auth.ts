import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const apiUrl =
  process.env.API_BASE_URL ??
  (process.env.API_URL ? `${process.env.API_URL}/api` : 'http://localhost:4000/api');

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const payload = await response.json();

        return {
          id: payload.user.id,
          name: payload.user.name,
          email: payload.user.email,
          role: payload.user.role,
          whatsappNumber: payload.user.whatsappNumber ?? null,
          accessToken: payload.accessToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.whatsappNumber = (user as { whatsappNumber?: string | null }).whatsappNumber ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        (session.user as { whatsappNumber?: string | null }).whatsappNumber =
          (token.whatsappNumber as string | null) ?? null;
      }

      session.accessToken = token.accessToken as string;

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
