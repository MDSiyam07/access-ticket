import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET - Lister tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (eventId) {
      // Utiliser SQL direct pour la relation many-to-many
      const users = await prisma.$queryRaw`
        SELECT u.id, u.email, u.name, u.role, u."createdAt"
        FROM "User" u
        INNER JOIN "EventUser" eu ON u.id = eu."userId"
        WHERE eu."eventId" = ${eventId}
        ORDER BY u."createdAt" DESC
      `;
      return NextResponse.json(users);
    } else {
      // Tous les utilisateurs
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return NextResponse.json(users);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, eventId } = await request.json();
    


    // Validation des données
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Validation du mot de passe (minimum 6 caractères)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    // Validation du rôle
    const validRoles = ['ADMIN', 'ENTRY', 'EXIT', 'REENTRY', 'VENDEUR'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur avec la relation many-to-many si eventId est fourni
    if (eventId) {
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Créer le lien EventUser
      await prisma.$executeRaw`
        INSERT INTO "EventUser" ("id", "userId", "eventId", "createdAt")
        VALUES (gen_random_uuid(), ${newUser.id}, ${eventId}, NOW())
      `;

      return NextResponse.json({
        success: true,
        user: newUser,
        message: 'Utilisateur créé avec succès',
      });
    } else {
      // Créer l'utilisateur sans événement
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        user: newUser,
        message: 'Utilisateur créé avec succès',
      });
    }

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 