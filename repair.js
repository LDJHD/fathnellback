// 🔧 SCRIPT DE RÉPARATION AUTOMATIQUE - FathNell Backend
console.log('🛠️ === RÉPARATION AUTOMATIQUE FATHNELL ===');

const fs = require('fs');
const path = require('path');

// 1. Créer les dossiers manquants
console.log('\n📁 Création des dossiers...');
const folders = [
    'public',
    'public/uploads',
    'public/uploads/produits',
    'public/uploads/collections'
];

folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        console.log(`✅ Dossier créé: ${folder}`);
    } else {
        console.log(`✅ Dossier existe: ${folder}`);
    }
});

// 2. Vérifier config.env
console.log('\n⚙️ Vérification config.env...');
if (fs.existsSync('config.env')) {
    console.log('✅ config.env existe');
    try {
        const config = fs.readFileSync('config.env', 'utf8');
        if (config.includes('DATABASE_HOST') && config.includes('DATABASE_USER')) {
            console.log('✅ config.env semble valide');
        } else {
            console.log('⚠️ config.env incomplet');
        }
    } catch (error) {
        console.log('❌ Erreur lecture config.env:', error.message);
    }
} else {
    console.log('❌ config.env manquant');
    // Créer un config.env exemple
    const exampleConfig = `# Configuration Base de Données
DATABASE_HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=
DATABASE_NAME=fathnell_db
DATABASE_PORT=3306

# JWT Secret
JWT_SECRET=xyzabc

# Server
PORT=3000
NODE_ENV=development`;
    
    fs.writeFileSync('config.env.example', exampleConfig);
    console.log('✅ config.env.example créé - Copiez-le vers config.env');
}

// 3. Tester la connexion BDD
console.log('\n🗃️ Test connexion base de données...');
try {
    const { connecter } = require('./bd/connect');
    connecter((error, connection) => {
        if (error) {
            console.error('❌ Erreur BDD:', error.message);
            console.log('💡 Suggestions:');
            console.log('   - Vérifiez que MySQL est démarré');
            console.log('   - Vérifiez config.env');
            console.log('   - Vérifiez que la base "fathnell_db" existe');
        } else {
            console.log('✅ Connexion BDD réussie');
            connection.end();
            
            // 4. Si BDD OK, tester les routes
            console.log('\n🛣️ Test des routes critiques...');
            testRoutes();
        }
    });
} catch (error) {
    console.error('❌ Erreur fichier connect.js:', error.message);
}

function testRoutes() {
    const criticalRoutes = [
        './route/couleur',
        './route/taille',
        './route/collection',
        './route/produit'
    ];
    
    let allRoutesOK = true;
    
    criticalRoutes.forEach(routePath => {
        try {
            require(routePath);
            console.log(`✅ Route ${routePath} OK`);
        } catch (error) {
            console.error(`❌ Route ${routePath} ERROR:`, error.message);
            allRoutesOK = false;
        }
    });
    
    if (allRoutesOK) {
        console.log('\n🎉 TOUTES LES ROUTES CRITIQUES FONCTIONNENT !');
        console.log('🚀 Vous pouvez démarrer avec: node index.js');
    } else {
        console.log('\n⚠️ Certaines routes ont des problèmes');
        console.log('🛠️ Utilisez: node index-minimal.js pour commencer');
    }
}

// 5. Créer un package.json minimal si manquant
console.log('\n📦 Vérification package.json...');
if (!fs.existsSync('package.json')) {
    const minimalPackage = {
        "name": "fathnell-backend",
        "version": "1.0.0",
        "description": "FathNell E-commerce Backend",
        "main": "index.js",
        "scripts": {
            "start": "node index.js",
            "dev": "node index.js",
            "debug": "node debug.js",
            "minimal": "node index-minimal.js"
        },
        "dependencies": {
            "express": "^4.18.0",
            "cors": "^2.8.5",
            "mysql2": "^3.0.0",
            "jsonwebtoken": "^9.0.0",
            "multer": "^1.4.5"
        }
    };
    
    fs.writeFileSync('package.json', JSON.stringify(minimalPackage, null, 2));
    console.log('✅ package.json créé');
} else {
    console.log('✅ package.json existe');
}

console.log('\n🎯 === RÉSUMÉ DE LA RÉPARATION ===');
console.log('1. Dossiers uploads créés');
console.log('2. Configuration vérifiée');
console.log('3. Base de données testée');
console.log('4. Routes critiques testées');
console.log('5. Package.json vérifié');

console.log('\n🚀 PROCHAINES ÉTAPES:');
console.log('1. Copiez config.env.example vers config.env');
console.log('2. Modifiez config.env avec vos vraies infos de BDD');
console.log('3. Démarrez avec: npm start ou node index-minimal.js');
