require('dotenv').config({ path: './config.env' });
const mysql = require('mysql');

console.log('🔧 Initialisation connexion MySQL FathNell...');

// Configuration de base
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fatnelle',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
};

console.log('📋 Configuration MySQL:', dbConfig);

// Fonction connecter qui crée une nouvelle connexion à chaque fois
function connecter(callback) {
    console.log('🔄 Création d\'une nouvelle connexion MySQL...');
    
    const connection = mysql.createConnection(dbConfig);
    
    connection.connect((err) => {
        if (err) {
            console.error('❌ Erreur connexion MySQL:', err.message);
            return callback(err, null);
        }
        
        console.log('✅ Connexion MySQL réussie');
        return callback(null, connection);
    });
    
    // Gestion des erreurs de connexion
    connection.on('error', (err) => {
        console.error('❌ Erreur connexion:', err.message);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('🔄 Connexion perdue');
        }
    });
}

// Test initial
connecter((error, connection) => {
    if (error) {
        console.error('❌ Test initial échoué:', error.message);
        console.log('💡 Vérifiez que MySQL est démarré et que la base existe');
    } else {
        console.log('✅ Test initial réussi');
        connection.end();
    }
});

module.exports = { connecter };
