const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const filePath = path.join(__dirname, '../../data/tournoi.json');

  try {
    const data = JSON.parse(event.body);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Données enregistrées avec succès.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de la sauvegarde des données.' })
    };
  }
};
