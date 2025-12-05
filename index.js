const express = require('express');
const cors = require('cors');
const { connecter } = require('./bd/connect');
const path = require("path");

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('🔄 Démarrage du serveur FathNell...');

// Test de connexion à la base de données
connecter((error, connection) => {
    if (error) {
        console.error('❌ ERREUR BDD:', error.message);
    } else {
        console.log('✅ Base de données connectée');
        connection.end();
    }
});

// Routes essentielles avec gestion d'erreurs
const essentialRoutes = [
    // Routes d'authentification
    { name: 'auth', path: './route/auth' },
    
    // Routes e-commerce nouvelles (créées)
    { name: 'couleur', path: './route/couleur' },
    { name: 'taille', path: './route/taille' },
    { name: 'collection', path: './route/collection' },
    { name: 'panier', path: './route/panier' },
    { name: 'commande', path: './route/commande' },
    { name: 'wishlist', path: './route/wishlist' },
    { name: 'banniere', path: './route/banniere' },
    
    // Routes de contact et newsletter
    { name: 'contact', path: './route/contact' },
    
    // Routes existantes mises à jour
    { name: 'produit', path: './route/produit' },
    { name: 'categorie', path: './route/categorie' },
    { name: 'vente', path: './route/vente' }
];

// Charger les routes avec gestion d'erreurs
essentialRoutes.forEach(route => {
    try {
        console.log(`🔄 Chargement de la route: ${route.name} depuis ${route.path}`);
        const routeModule = require(route.path);
        
        // Pour les routes spéciales, utiliser des préfixes spécifiques
        if (route.name === 'auth') {
            app.use("/api/v1/auth", routeModule);
            console.log(`✅ Route ${route.name} chargée depuis ${route.path} sur /api/v1/auth`);
        } else if (route.name === 'contact') {
            app.use("/api/v1/contact", routeModule);
            console.log(`✅ Route ${route.name} chargée depuis ${route.path} sur /api/v1/contact`);
            console.log(`   📍 Routes disponibles: POST /api/v1/contact/newsletter/subscribe, POST /api/v1/contact/send`);
        } else {
            app.use("/api/v1", routeModule);
            console.log(`✅ Route ${route.name} chargée depuis ${route.path}`);
        }
        
        // Vérifier que le module exporte bien un router
        if (typeof routeModule === 'function') {
            console.log(`   └─ Type: Router Express`);
        } else {
            console.warn(`   ⚠️  Type inattendu: ${typeof routeModule}`);
        }
    } catch (error) {
        console.error(`❌ Erreur route ${route.name}:`, error.message);
        console.error(`   Chemin: ${route.path}`);
        console.error(`   Stack:`, error.stack);
    }
});

// Routes optionnelles (avec gestion d'erreurs silencieuse)
const optionalRoutes = [
    { name: 'login', path: './route/login' },
    { name: 'utilisateur', path: './route/utilisateur' },
    { name: 'client', path: './route/client' }
];

optionalRoutes.forEach(route => {
    try {
        const routeModule = require(route.path);
        app.use("/api/v1", routeModule);
        console.log(`✅ Route optionnelle ${route.name} chargée`);
    } catch (error) {
        console.warn(`⚠️  Route optionnelle ${route.name} ignorée:`, error.message);
    }
});

// Servir les fichiers statiques
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Route de santé
app.get('/api/v1/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'FathNell API fonctionne',
        timestamp: new Date().toISOString(),
        routes_available: [
            'GET  /api/v1/health',
            'GET  /api/v1/couleur/listall',
            'GET  /api/v1/taille/listall',
            'GET  /api/v1/collection/listall',
            'GET  /api/v1/produit/listall',
            'GET  /api/v1/categorie/listall',
            'POST /api/v1/panier/get',
            'POST /api/v1/commande/creer',
        ]
    });
});

// Route de test pour vérifier que les routes sont bien chargées
app.get('/api/v1/test-routes', (req, res) => {
    res.json({ 
        message: 'Routes test',
        timestamp: new Date().toISOString()
    });
});

// Gestion des erreurs 404 (doit être en dernier)
app.use('*', (req, res) => {
    // Ignorer les requêtes pour les fichiers statiques
    if (req.originalUrl.startsWith('/uploads/') || req.originalUrl.startsWith('/public/')) {
        return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    console.log(`⚠️  Route non trouvée: ${req.method} ${req.originalUrl}`);
    console.log(`   📍 Routes disponibles:`);
    console.log(`      - POST /api/v1/contact/newsletter/subscribe`);
    console.log(`      - POST /api/v1/contact/send`);
    console.log(`      - POST /api/v1/auth/register`);
    console.log(`      - POST /api/v1/auth/login`);
    
    res.status(404).json({ 
        error: 'Route non trouvée',
        path: req.originalUrl,
        method: req.method,
        available_routes: [
            'POST /api/v1/contact/newsletter/subscribe',
            'POST /api/v1/contact/send',
            'POST /api/v1/auth/register',
            'POST /api/v1/auth/login',
            'GET /api/v1/health'
        ]
    });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('❌ Erreur serveur:', error.message);
    res.status(500).json({ 
        error: 'Erreur serveur',
        message: error.message
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
    if (error) {
        console.error('❌ Erreur démarrage serveur:', error);
        process.exit(1);
    }
    
    console.log(`🚀 Serveur FathNell démarré sur http://localhost:${PORT}`);
    console.log(`🧪 Test: curl http://localhost:${PORT}/api/v1/health`);
    console.log(`📋 API Documentation:`);
    console.log(`   - Santé: GET /api/v1/health`);
    console.log(`   - Auth - Inscription: POST /api/v1/auth/register`);
    console.log(`   - Auth - Connexion: POST /api/v1/auth/login`);
    console.log(`   - Couleurs: GET /api/v1/couleur/listall`);
    console.log(`   - Tailles: GET /api/v1/taille/listall`);
    console.log(`   - Collections: GET /api/v1/collection/listall`);
    console.log(`   - Produits: GET /api/v1/produit/listall`);
    console.log(`📁 Uploads: http://localhost:${PORT}/uploads/`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🔄 Arrêt du serveur...');
    process.exit(0);
});

module.exports = app;
