require('dotenv').config();
const mysql = require('mysql');

// Créer un pool de connexions au lieu d'une seule connexion
let pool = null;

function connecter(callback) {
    if (pool === null) {
        // Créer un pool de connexions
        pool = mysql.createPool({
            connectionLimit: 10,  // Limite du nombre de connexions simultanées
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectTimeout: 10000,  // Temps d'attente pour la connexion (10 secondes)
            waitForConnections: true,  // Attendre qu'une connexion se libère si le pool est plein
            queueLimit: 0  // Pas de limite sur le nombre de requêtes dans la file d'attente
        });

        pool.getConnection((error, connection) => {
            if (error) {
                pool = null;
                console.error("Erreur lors de la connexion à la base de données :", error);
                return callback(error, null);
            } else {
                console.log("Connexion à la base de données établie avec succès.");
                connection.release();  // Libère la connexion dès qu'elle est utilisée
                return callback(null, pool);  // Retourne le pool au lieu de la connexion seule
            }
        });
    } else {
        console.log("Déjà connecté à la base de données.");
        return callback(null, pool);
    }
}

module.exports = { connecter };
