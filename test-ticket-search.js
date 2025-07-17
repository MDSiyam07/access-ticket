import fetch from 'node-fetch';

async function testTicketSearch() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Test de la recherche de tickets...\n');

  // Test avec un ticket qui n'existe probablement pas
  console.log('1. Test avec un ticket inexistant...');
  try {
    const response = await fetch(`${baseUrl}/api/tickets/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticketNumber: 'TEST123456',
        eventId: 'test-event-id'
      }),
    });

    const data = await response.json();
    console.log('✅ Réponse reçue:', data);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n2. Test avec des paramètres manquants...');
  try {
    const response = await fetch(`${baseUrl}/api/tickets/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticketNumber: 'TEST123456'
        // eventId manquant
      }),
    });

    const data = await response.json();
    console.log('✅ Réponse reçue:', data);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\n✅ Tests terminés !');
}

testTicketSearch().catch(console.error); 