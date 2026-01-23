import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
      })
  ],
  secret: process.env.NEXTAUTH_SECRET || "secr3t",
  callbacks: {
    async jwt({ token,user }: any) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    //@ts-ignore
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id; // user comes from the database
      }
      return session;
    },
    
  },
 
}

export default NextAuth(authOptions)