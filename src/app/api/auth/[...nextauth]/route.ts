import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email } 
        });
        
        if (!user) return null;
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        // The object returned here is passed to the 'jwt' callback as the 'user' parameter
        return isValid ? { id: user.id, email: user.email } : null;
      }
    })
  ],
  callbacks: {
    // 1. Transfer the 'id' from the user object to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // 2. Transfer the 'id' from the JWT token to the active session object
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: '/fuelzenr/login' }
});

export { handler as GET, handler as POST };