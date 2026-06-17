const express = require('express');
const { createClient } = require('redis');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Configuration du client Redis
const redisUrl = process.env.SCALINGO_REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.error('Erreur client Redis', err));

// Connexion à Redis
(async () => {
  try {
    await redisClient.connect();
    console.log('Connecté à Redis avec succès');
  } catch (err) {
    console.error('Échec de la connexion à Redis:', err);
  }
})();

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Mécanisme de cache avec TTL de 10 secondes
const CACHE_TTL = 10;

app.get('/api/data', async (req, res) => {
  const cacheKey = 'app_data_cache';
  
  try {
    // Essayer de récupérer les données du cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json({ source: 'cache', data: JSON.parse(cachedData) });
    }

    // Simuler la récupération de données fraîches (ex: depuis une BDD ou API externe)
    const freshData = { 
      message: 'Bonjour depuis Scalingo !', 
      timestamp: new Date().toISOString() 
    };
    
    // Stocker dans le cache avec un TTL de 10 secondes
    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(freshData));
    
    res.json({ source: 'fresh', data: freshData });
  } catch (error) {
    console.error('Erreur lors de la gestion du cache:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Le serveur est en cours d'exécution sur le port ${port}`);
});