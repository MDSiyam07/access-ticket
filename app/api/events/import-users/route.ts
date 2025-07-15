import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// POST - Importer les utilisateurs d'un événement vers un autre
export async function POST(request: NextRequest) {
  try {
    const { sourceEventId, targetEventId } = await request.json();

    if (!sourceEventId || !targetEventId) {
      return NextResponse.json(
        { error: 'Les IDs des événements source et cible sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que les événements existent
    const sourceEvent = await prisma.event.findUnique({
      where: { id: sourceEventId },
    });

    const targetEvent = await prisma.event.findUnique({
      where: { id: targetEventId },
    });

    if (!sourceEvent || !targetEvent) {
      return NextResponse.json(
        { error: 'Un ou les deux événements n\'existent pas' },
        { status: 404 }
      );
    }

    // Récupérer les utilisateurs de l'événement source
    const sourceUsers = await prisma.user.findMany({
      where: {
        eventId: sourceEventId,
      },
      select: {
        name: true,
        email: true,
        role: true,
      },
    });

    if (sourceUsers.length === 0) {
      return NextResponse.json(
        { error: 'Aucun utilisateur trouvé dans l\'événement source' },
        { status: 404 }
      );
    }

    // Créer les nouveaux utilisateurs pour l'événement cible
    const importedUsers = [];
    const errors = [];

    for (const user of sourceUsers) {
      try {
        // Vérifier si l'utilisateur existe déjà globalement
        const existingUser = await prisma.user.findUnique({
          where: {
            email: user.email,
          },
        });

        if (existingUser) {
          // Si l'utilisateur existe déjà, on l'associe simplement à l'événement cible
          if (existingUser.eventId === targetEventId) {
            errors.push(`L'utilisateur ${user.email} existe déjà dans l'événement cible`);
            continue;
          } else {
            // Mettre à jour l'événement de l'utilisateur existant
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { eventId: targetEventId },
            });
            
            importedUsers.push({
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              role: existingUser.role,
              tempPassword: 'Utilisateur existant',
            });
            continue;
          }
        }

        // Générer un mot de passe temporaire
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Créer le nouvel utilisateur
        const newUser = await prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            eventId: targetEventId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        importedUsers.push({
          ...newUser,
          tempPassword, // Inclure le mot de passe temporaire pour l'affichage
        });
      } catch (error) {
        console.error(`Erreur lors de la création de l'utilisateur ${user.email}:`, error);
        errors.push(`Erreur lors de la création de l'utilisateur ${user.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${importedUsers.length} utilisateur(s) importé(s) avec succès`,
      importedUsers,
      errors,
      totalSourceUsers: sourceUsers.length,
      totalImported: importedUsers.length,
    });

  } catch (error) {
    console.error('Erreur lors de l\'import des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 