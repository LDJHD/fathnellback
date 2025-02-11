const mysql = require('mysql');

let connection = null;

function connecter(callback) {
    if (connection === null) {
        connection = mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'topzen'
        });

        connection.connect((error) => {
            if (error) {
                connection = null;
                console.error("Erreur lors de la connexion à la base de données :", error);
                return callback(error, null);
            } else {
                console.log("Connexion à la base de données établie avec succès.");
                return callback(null, connection);
            }
        });
    } else {
        console.log("Déjà connecté à la base de données.");
        return callback(null, connection);
    }
}

module.exports = { connecter }; 