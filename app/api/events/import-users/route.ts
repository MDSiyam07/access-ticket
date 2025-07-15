import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SourceUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CountResult {
  count: number;
}

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

    // Récupérer les utilisateurs de l'événement source via SQL direct
    const sourceUsers = await prisma.$queryRaw<SourceUser[]>`
      SELECT u.id, u.name, u.email, u.role
      FROM "User" u
      INNER JOIN "EventUser" eu ON u.id = eu."userId"
      WHERE eu."eventId" = ${sourceEventId}
    `;

    if (sourceUsers.length === 0) {
      return NextResponse.json(
        { error: 'Aucun utilisateur trouvé dans l\'événement source' },
        { status: 404 }
      );
    }

    const importedUsers = [];
    const errors = [];

    for (const user of sourceUsers) {
      try {
        // Vérifier si l'utilisateur existe déjà dans l'événement cible
        const alreadyLinked = await prisma.$queryRaw<CountResult[]>`
          SELECT COUNT(*) as count
          FROM "EventUser"
          WHERE "userId" = ${user.id} AND "eventId" = ${targetEventId}
        `;
        
        if (alreadyLinked[0].count > 0) {
          errors.push(`L'utilisateur ${user.email} existe déjà dans l'événement cible`);
          continue;
        }

        // Créer le lien EventUser pour associer l'utilisateur à l'événement cible
        await prisma.$executeRaw`
          INSERT INTO "EventUser" ("id", "userId", "eventId", "createdAt")
          VALUES (gen_random_uuid(), ${user.id}, ${targetEventId}, NOW())
        `;
        
        importedUsers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tempPassword: 'Utilisateur existant',
        });
      } catch (error) {
        console.error(`Erreur lors de l'association de l'utilisateur ${user.email}:`, error);
        errors.push(`Erreur lors de l'association de l'utilisateur ${user.email}`);
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