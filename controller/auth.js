const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connecter } = require("../bd/connect");

// Inscription pour le dashboard
const register = async (req, res) => {
    try {
        const { nom, prenom, email, password, confirmpassword } = req.body;

        // Validation des champs
        if (!nom || !prenom || !email || !password || !confirmpassword) {
            return res.status(400).json({ erreur: "Tous les champs sont requis" });
        }

        // Vérifier que les mots de passe correspondent
        if (password !== confirmpassword) {
            return res.status(400).json({ erreur: "Les mots de passe ne correspondent pas" });
        }

        // Vérifier la longueur du mot de passe
        if (password.length < 6) {
            return res.status(400).json({ erreur: "Le mot de passe doit contenir au moins 6 caractères" });
        }

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Vérifier si l'email existe déjà
            connection.query('SELECT * FROM users WHERE email = ?', [email], async (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la recherche de l'email :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la recherche de l'email" });
                }

                if (results.length > 0) {
                    return res.status(400).json({ erreur: "Cet email est déjà utilisé" });
                }

                // Hasher le mot de passe
                const hashedPassword = await bcrypt.hash(password, 10);

                // Créer l'utilisateur avec actif = 0 (en attente de confirmation admin)
                const utilisateur = {
                    nom: nom,
                    prenom: prenom,
                    email: email,
                    password: hashedPassword,
                    status: 'user',
                    actif: 0, // Compte non activé par défaut
                    created_at: new Date(),
                    updated_at: new Date()
                };

                connection.query('INSERT INTO users SET ?', utilisateur, (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de l'ajout de l'utilisateur :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de l'ajout de l'utilisateur" });
                    }

                    return res.status(201).json({ 
                        message: "Inscription réussie. Votre compte est en attente de confirmation par l'administrateur.",
                        user_id: result.insertId
                    });
                });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

// Connexion pour le dashboard
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ erreur: "Email et mot de passe requis" });
        }

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
                    return res.status(400).json({ erreur: "Email ou mot de passe incorrect" });
                }

                const utilisateur = results[0];

                // Vérifier si le compte est actif (confirmé par l'admin)
                if (utilisateur.actif === 0) {
                    return res.status(403).json({ 
                        erreur: "Votre compte n'est pas encore activé. Veuillez attendre la confirmation de l'administrateur." 
                    });
                }

                // Vérifier le mot de passe
                const passwordMatch = await bcrypt.compare(password, utilisateur.password);

                if (!passwordMatch) {
                    return res.status(400).json({ erreur: "Email ou mot de passe incorrect" });
                }

                // Générer le token JWT
                const token = jwt.sign({ 
                    id: utilisateur.id, 
                    email: utilisateur.email,
                    nom: utilisateur.nom,
                    prenom: utilisateur.prenom
                }, 'xyzabc', { expiresIn: '24h' });

                return res.status(200).json({ 
                    message: "Authentification réussie", 
                    token,
                    user: {
                        id: utilisateur.id,
                        nom: utilisateur.nom,
                        prenom: utilisateur.prenom,
                        email: utilisateur.email
                    }
                });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

module.exports = { register, login };

