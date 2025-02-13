const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connecter } = require("../bd/connect");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM users WHERE email = ?', [email], async (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la recherche de l'utilisateur :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la recherche de l'utilisateur" });
                }

                if (results.length === 0) {
                    return res.status(400).json({ erreur: "Email ou mot de passe incorrect ma" });
                }

                const utilisateur = results[0];
                const passwordMatch = await bcrypt.compare(password, utilisateur.password);

                if (!passwordMatch) {
                    return res.status(400).json({ erreur: "Email ou mot de passe incorrect mo" });
                }

                const token = jwt.sign({ id: utilisateur.id, email: utilisateur.email }, 'xyzabc', { expiresIn: '24h' });

                return res.status(200).json({ message: "Authentification réussie", token });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}

module.exports = { login };
