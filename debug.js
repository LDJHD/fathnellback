// 🔧 SCRIPT DE DEBUG - FathNell Backend
console.log('🔍 === DEBUG FATHNELL BACKEND ===');

// Test 1: Modules de base
console.log('\n📦 Test des modules...');
try {
    const express = require('express');
    const cors = require('cors');
    console.log('✅ Express et CORS OK');
} catch (error) {
    console.error('❌ Erreur modules de base:', error.message);
    process.exit(1);
}

// Test 2: Connexion base de données
console.log('\n🗃️ Test connexion BDD...');
try {
    const { connecter } = require('./bd/connect');
    connecter((error, connection) => {
        if (error) {
            console.error('❌ Erreur BDD:', error.message);
            console.log('💡 Vérifiez config.env et que MySQL est démarré');
        } else {
            console.log('✅ Connexion BDD OK');
            connection.end();
        }
    });
} catch (error) {
    console.error('❌ Erreur fichier connect.js:', error.message);
}

// Test 3: Routes une par une
console.log('\n🛣️ Test des routes...');
const routes = [
    { name: 'couleur', path: './route/couleur' },
    { name: 'taille', path: './route/taille' },
    { name: 'collection', path: './route/collection' },
    { name: 'panier', path: './route/panier' },
    { name: 'commande', path: './route/commande' },
    { name: 'produit', path: './route/produit' },
    { name: 'categorie', path: './route/categorie' },
    { name: 'vente', path: './route/vente' }
];

routes.forEach(route => {
    try {
        require(route.path);
        console.log(`✅ Route ${route.name} OK`);
    } catch (error) {
        console.error(`❌ Route ${route.name} ERROR:`, error.message);
        if (error.stack) {
            console.error('📍 Stack:', error.stack.split('\n')[1]);
        }
    }
});

// Test 4: Démarrage serveur minimal
console.log('\n🚀 Test serveur minimal...');
try {
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    app.get('/test', (req, res) => {
        res.json({ message: 'Test OK' });
    });
    
    const server = app.listen(3001, () => {
        console.log('✅ Serveur test démarré sur port 3001');
        console.log('🧪 Test: http://localhost:3001/test');
        
        // Arrêter le serveur de test après 2 secondes
        setTimeout(() => {
            server.close();
            console.log('🔄 Serveur test arrêté');
            
            console.log('\n🎯 === RÉSUMÉ ===');
            console.log('Si tout est ✅ ci-dessus, le problème vient des routes spécifiques');
            console.log('Si ❌, corrigez les erreurs avant de continuer');
            console.log('\n💡 Pour démarrer en mode sûr:');
            console.log('node index.js');
            
        }, 2000);
    });
    
} catch (error) {
    console.error('❌ Erreur serveur minimal:', error.message);
}
