// src/lib/auth.ts - Configurazione NextAuth.js
// Timestamp: 2024-12-09

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e password richiesti');
        }

        // Trova utente nel database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { plan: true },
        });

        if (!user) {
          throw new Error('Credenziali non valide');
        }

        // Verifica password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Credenziali non valide');
        }

        // Ritorna dati utente per sessione
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          planId: user.planId,
          planName: user.plan?.name || 'Free',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Prima autenticazione: aggiungi dati utente al token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.planId = user.planId;
        token.planName = user.planName;
      }
      return token;
    },
    async session({ session, token }) {
      // Passa dati dal token alla sessione client
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.planId = token.planId as string | null;
        session.user.planName = token.planName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 giorni
  },
  secret: process.env.NEXTAUTH_SECRET,
};


