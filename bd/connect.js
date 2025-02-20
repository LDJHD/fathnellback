require('dotenv').config();
const mysql = require('mysql');

let pool = null; // Stocke l'instance unique du pool

function connecter(callback) {
    if (!pool) {
        pool = mysql.createPool({
            connectionLimit: 10,  // Nombre max de connexions simultanées
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectTimeout: 10000,  // Temps max avant échec de connexion
            waitForConnections: true,  // Attendre une connexion si le pool est plein
            queueLimit: 0  // Pas de limite sur la file d'attente
        });

        console.log("✅ Pool de connexions MySQL créé.");
    } else {
        console.log("🔄 Pool de connexions MySQL réutilisé.");
    }

    return callback(null, pool);
}

module.exports = { connecter };
