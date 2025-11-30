const express = require('express');
const cors = require('cors');
const path = require("path");

console.log('🚀 FathNell Backend - Mode Minimal');

const app = express();

// Middleware de base
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes de test de base
app.get('/', (req, res) => {
    res.json({
        message: '🎉 FathNell API en ligne !',
        status: 'OK',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /',
            'GET /api/v1/test',
            'GET /api/v1/status'
        ]
    });
});

app.get('/api/v1/test', (req, res) => {
    res.json({
        message: 'Test endpoint fonctionne',
        backend: 'FathNell',
        version: '1.0.0'
    });
});

app.get('/api/v1/status', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Gestion d'erreurs
app.use((error, req, res, next) => {
    console.error('❌ Erreur:', error.message);
    res.status(500).json({ 
        error: 'Erreur serveur',
        message: error.message
    });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, (error) => {
    if (error) {
        console.error('❌ Impossible de démarrer le serveur:', error);
        process.exit(1);
    }
    
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`🧪 Tests disponibles:`);
    console.log(`   - http://localhost:${PORT}/`);
    console.log(`   - http://localhost:${PORT}/api/v1/test`);
    console.log(`   - http://localhost:${PORT}/api/v1/status`);
    console.log(`\n🔧 Une fois que ça fonctionne, ajoutez les routes progressivement`);
});

// Arrêt propre
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});

module.exports = app;
