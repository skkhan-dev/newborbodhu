import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";

import { getApiBaseUrl } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

/**
 * NextAuth.js v5 configuration for Borbodhu.
 *
 * Supports:
 * - Email/password login (Credentials provider → existing API)
 * - Google OAuth (one-click signup/login for members)
 * - Facebook OAuth (one-click signup/login for members)
 *
 * After social login, the user is directed to complete their
 * profile registration if they don't have a member profile yet.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) return null;

          const data = (await response.json()) as LoginResponse;

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.email,
            accessToken: data.accessToken,
            roles: data.user.roles,
            borbodhuUser: data.user,
          };
        } catch {
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // After initial sign-in, attach user data to the JWT
      if (user) {
        token.accessToken = (user as Record<string, unknown>).accessToken as string | undefined;
        token.roles = (user as Record<string, unknown>).roles as string[] | undefined;
        token.borbodhuUser = (user as Record<string, unknown>).borbodhuUser as AuthUser | undefined;
      }

      // For OAuth sign-ins, register/link the user with the Borbodhu API
      if (account && (account.provider === "google" || account.provider === "facebook")) {
        try {
          const response = await fetch(`${getApiBaseUrl()}/auth/social-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              email: token.email,
              name: token.name,
              image: token.picture,
              accessToken: account.access_token,
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as LoginResponse;
            token.accessToken = data.accessToken;
            token.roles = data.user.roles;
            token.borbodhuUser = data.user;
          }
        } catch {
          // Social login API integration not yet available — continue with basic session
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Expose Borbodhu-specific data in the session
      const extended = session as unknown as Record<string, unknown>;
      if (token.accessToken) {
        extended.accessToken = token.accessToken;
      }
      if (token.roles) {
        extended.roles = token.roles;
      }
      if (token.borbodhuUser) {
        extended.borbodhuUser = token.borbodhuUser;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
};
