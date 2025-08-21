import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt";
import dbConnect from "./dbConnect";
import User from "@/models/User";

// Extend the JWT type to include accessToken
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}

// Extend the Session type to include accessToken
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error',
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const email = user?.email;
        if (!email) return true; // allow sign-in even if we cannot persist

        await dbConnect();

        const existing = await User.findOne({ email });
        if (!existing) {
          await User.create({
            email,
            name: user.name || email.split('@')[0],
          });
        } else {
          let updated = false;
          if (user.name && user.name !== existing.name) {
            existing.name = user.name;
            updated = true;
          }
          // Ensure referralCode exists
          if (!existing.referralCode) {
            // Generate a unique referral code like TM-XXXXXX
            const gen = async () => {
              const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
              let code = '';
              for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
              return `TM-${code}`;
            };
            let code = await gen();
            // Check uniqueness
            // retry up to a few times in rare collision
            for (let i = 0; i < 5; i++) {
              const taken = await User.findOne({ referralCode: code });
              if (!taken) break;
              code = await gen();
            }
            existing.referralCode = code;
            updated = true;
          }
          if (updated) await existing.save();
        }
      } catch (err) {
        console.warn('signIn user persistence warning:', err);
        // do not block sign-in on DB issues
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
