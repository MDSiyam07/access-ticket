// Script de test pour la fonctionnalité d'import d'utilisateurs
const testImportUsers = async () => {
  try {
    console.log('🧪 Test de la fonctionnalité d\'import d\'utilisateurs...');

    // 1. Récupérer la liste des événements
    console.log('\n1. Récupération des événements...');
    const eventsResponse = await fetch('http://localhost:3000/api/events');
    const events = await eventsResponse.json();
    console.log('Événements disponibles:', events.map(e => ({ id: e.id, name: e.name, users: e._count?.users || 0 })));

    if (events.length < 2) {
      console.log('❌ Il faut au moins 2 événements pour tester l\'import');
      return;
    }

    const sourceEvent = events[0];
    const targetEvent = events[1];

    console.log(`\n2. Test d'import depuis "${sourceEvent.name}" vers "${targetEvent.name}"`);

    // 2. Récupérer les utilisateurs de l'événement source
    console.log('\n3. Récupération des utilisateurs de l\'événement source...');
    const usersResponse = await fetch(`http://localhost:3000/api/events/${sourceEvent.id}/users`);
    const sourceUsers = await usersResponse.json();
    console.log('Utilisateurs dans l\'événement source:', sourceUsers.length);

    // 3. Tester l'import
    console.log('\n4. Test de l\'import d\'utilisateurs...');
    const importResponse = await fetch('http://localhost:3000/api/events/import-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceEventId: sourceEvent.id,
        targetEventId: targetEvent.id,
      }),
    });

    const importResult = await importResponse.json();
    console.log('Résultat de l\'import:', importResult);

    if (importResponse.ok) {
      console.log('✅ Import réussi !');
      console.log(`   - ${importResult.totalImported} utilisateur(s) importé(s)`);
      console.log(`   - ${importResult.errors.length} erreur(s)`);
      
      if (importResult.importedUsers.length > 0) {
        console.log('\nUtilisateurs importés:');
        importResult.importedUsers.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - ${user.role} - Mot de passe: ${user.tempPassword}`);
        });
      }
    } else {
      console.log('❌ Erreur lors de l\'import:', importResult.error);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Exécuter le test si le script est appelé directement
if (typeof window === 'undefined') {
  testImportUsers();
} 