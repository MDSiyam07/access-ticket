// Script de test pour l'import de tickets
// Utilisation: node test-import.js

import fs from 'fs';

// Créer un fichier CSV de test
const testData = `number,name,email
TICKET001,John Doe,john@example.com
TICKET002,Jane Smith,jane@example.com
TICKET003,Bob Johnson,bob@example.com
TICKET004,Alice Brown,alice@example.com
TICKET005,Charlie Wilson,charlie@example.com`;

fs.writeFileSync('test-tickets.csv', testData);
console.log('Fichier test-tickets.csv créé avec succès !');
console.log('Vous pouvez maintenant utiliser ce fichier pour tester l\'import dans la page admin.'); 