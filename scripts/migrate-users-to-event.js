import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUsersToEvent() {
  try {
    console.log('🚀 Début de la migration des utilisateurs vers l\'événement Médina 2025 Ouani...');

    // 1. Trouver l'événement Médina 2025 Ouani
    const event = await prisma.event.findFirst({
      where: {
        name: {
          contains: 'Médina 2025 Ouani',
          mode: 'insensitive'
        }
      }
    });

    if (!event) {
      console.error('❌ Événement "Médina 2025 Ouani" non trouvé');
      return;
    }

    console.log(`✅ Événement trouvé: ${event.name} (ID: ${event.id})`);

    // 2. Récupérer tous les utilisateurs existants
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    console.log(`📊 ${allUsers.length} utilisateurs trouvés dans la base de données`);

    if (allUsers.length === 0) {
      console.log('ℹ️ Aucun utilisateur à migrer');
      return;
    }

    // 3. Vérifier quels utilisateurs sont déjà liés à cet événement
    const existingLinks = await prisma.$queryRaw`
      SELECT "userId"
      FROM "EventUser"
      WHERE "eventId" = ${event.id}
    `;

    const existingUserIds = existingLinks.map(link => link.userId);
    console.log(`📋 ${existingUserIds.length} utilisateurs déjà liés à l'événement`);

    // 4. Filtrer les utilisateurs qui ne sont pas encore liés
    const usersToMigrate = allUsers.filter(user => !existingUserIds.includes(user.id));

    console.log(`🔄 ${usersToMigrate.length} utilisateurs à migrer`);

    if (usersToMigrate.length === 0) {
      console.log('✅ Tous les utilisateurs sont déjà liés à l\'événement');
      return;
    }

    // 5. Créer les liens EventUser pour chaque utilisateur
    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "EventUser" ("id", "userId", "eventId", "createdAt")
          VALUES (gen_random_uuid(), ${user.id}, ${event.id}, NOW())
        `;
        
        console.log(`✅ Migré: ${user.name} (${user.email}) - ${user.role}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Erreur lors de la migration de ${user.email}:`, error.message);
        errorCount++;
      }
    }

    // 6. Afficher le résumé
    console.log('\n📈 Résumé de la migration:');
    console.log(`   • Utilisateurs traités: ${allUsers.length}`);
    console.log(`   • Déjà liés: ${existingUserIds.length}`);
    console.log(`   • Migrés avec succès: ${migratedCount}`);
    console.log(`   • Erreurs: ${errorCount}`);
    console.log(`   • Total liés à l'événement: ${existingUserIds.length + migratedCount}`);

    // 7. Vérifier le résultat final
    const finalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "EventUser"
      WHERE "eventId" = ${event.id}
    `;

    console.log(`\n🎯 Nombre final d'utilisateurs dans l'événement: ${finalCount[0].count}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
migrateUsersToEvent()
  .then(() => {
    console.log('\n✅ Migration terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }); 