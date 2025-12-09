// src/app/api/auth/register/route.ts - API Registrazione utente
// Timestamp: 2024-12-09

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Schema validazione
const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password minimo 6 caratteri'),
  name: z.string().min(2, 'Nome minimo 2 caratteri').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valida input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Verifica se email esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già registrata' },
        { status: 400 }
      );
    }

    // Ottieni piano Free di default
    const freePlan = await prisma.plan.findUnique({
      where: { name: 'Free' },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crea utente
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        planId: freePlan?.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(
      { message: 'Registrazione completata', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Errore durante la registrazione' },
      { status: 500 }
    );
  }
}


