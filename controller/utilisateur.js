const { connecter } = require("../bd/connect");
const bcrypt = require('bcrypt');

const {envoyerEmail} =   require('./mailer');


const ajouterUtilisateur = async (req, res) => {
    try {
        const date = new Date();
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const utilisateur = {
            nom: req.body.nom,
            prenom: req.body.prenom,
            email: req.body.email,
            password: hashedPassword,
            status: 'user',
            pays: req.body.pays,
            whatsapp: req.body.whatsapp,
            actif: 0,
            created_at: date,
            updated_at: date
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM users WHERE email = ?', [req.body.email], (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la recherche de l'email :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la recherche de l'email" });
                }

                if (results.length > 0) {
                    return res.status(400).json({ erreur: "Cet email est déjà utilisé" });
                }

                if (req.body.password === req.body.confirmpassword) {
                    connection.query('INSERT INTO users SET ?', utilisateur, (erreur, result) => {
                        if (erreur) {
                            console.error("Erreur lors de l'ajout de l'utilisateur :", erreur);
                            return res.status(500).json({ erreur: "Erreur lors de l'ajout de l'utilisateur" });
                        } else {
                            console.log("Utilisateur ajouté avec succès.");
                            envoyerEmail(req.body.email, 'Bienvenue TO CONNECT', 'Merci de vous être inscrit à TO CONNECT.', '<p>Bienvenue sur TO CONNECT! Merci de vous être inscrit. Nous sommes ravis de vous avoir parmi nous.</p>');

                            return res.status(200).json(result);
                        }
                    });
                } else {
                    console.log('Erreur : les mots de passe ne correspondent pas');
                    return res.status(400).json({ erreur: "Les mots de passe ne correspondent pas" });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};
 

    const listallUtilisateur = async (req, res) => {
        try {
            connecter((error, connection) => {
                if (error) {
                    console.error("Erreur lors de la connexion à la base de données :", error);
                    return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
                }
    
                connection.query('SELECT id,nom,prenom,email,whatsapp,status,actif,pays, password,DATE_FORMAT(created_at, "%d/%m/%Y %H:%i:%s") AS date from users', (erreur, results) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération des Utilisateurs :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération des users" });
                    } else {
                        return res.status(200).json(results);
                    }
                });
            });
        } catch (error) {
            console.error("Erreur serveur :", error);
            return res.status(500).json({ erreur: "Erreur serveur" });
        }
    };
    
    
    const detailUserconnectUtilisateur = async (req, res) => {
        try {
            // Vérifie si req.user existe et a un id
            if (!req.user || !req.user.id) {
                console.error("❌ ID utilisateur manquant dans la requête !");
                return res.status(400).json({ erreur: "ID utilisateur manquant dans la requête" });
            }
    console.log(1)
            const id = req.user.id;
            console.log("✅ ID utilisateur récupéré :", id);
    
            connecter((error, connection) => {
                if (error) {
                    console.error("❌ Erreur de connexion à la base de données :", error);
                    return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
                }
    
                // Exécution de la requête SQL
                connection.query('SELECT * from users WHERE id = ?', [id], (erreur, result) => {
                    if (erreur) {
                        console.error("❌ Erreur SQL lors de la récupération de l'utilisateur :", erreur);
                        return res.status(500).json({ erreur: "Erreur SQL lors de la récupération de l'utilisateur" });
                    }
    
                    console.log("📌 Résultat de la requête SQL :", result);
    
                    if (result.length === 0) {
                        console.log("❌ Utilisateur non trouvé !");
                        return res.status(404).json({ erreur: "Utilisateur non trouvé" });
                    }
    
                    console.log("✅ Utilisateur trouvé :", result[0]);
                    return res.status(200).json(result[0]);
                });
            });
    
        } catch (error) {
            console.error("❌ Erreur serveur :", error);
            return res.status(500).json({ erreur: "Erreur serveur" });
        }
    };
    
    
    // const updateUtilisateur = async (req, res) => {
    //     try {
    //         const { id, status, actif } = req.body;
    //         const date = new Date();
    
    //         if (!id) {
    //             return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
    //         }
    
    //         // Construire l'objet de mise à jour en ne prenant que les valeurs définies
    //         const Utilisateur = {};
    //         if (actif === 1 || actif === 0) Utilisateur.actif = actif;
    //         if (status !== undefined) Utilisateur.status = status; 
    //         Utilisateur.updated_at = date;
    
    //         if (Object.keys(Utilisateur).length === 1) {
    //             return res.status(400).json({ erreur: "Aucune donnée à mettre à jour" });
    //         }
    
    //         connecter((error, connection) => {
    //             if (error) {
    //                 console.error("Erreur lors de la connexion à la base de données :", error);
    //                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
    //             }
    
    //             const updateQuery = 'UPDATE users SET ? WHERE id = ?';
    //             connection.query(updateQuery, [Utilisateur, id], (erreur, result) => {
    //                 if (erreur) {
    //                     console.error("Erreur lors de la mise à jour de l'utilisateur :", erreur);
    //                     return res.status(500).json({ erreur: "Erreur lors de la mise à jour de l'utilisateur" });
    //                 }
    
    //                 if (result.affectedRows === 0) {
    //                     return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
    //                 }
    
    //                 console.log("Utilisateur mis à jour avec succès.");
    //                 return res.status(200).json({ message: "Mise à jour réussie", result });
    //             });
    //         });
    //     } catch (error) {
    //         console.error("Erreur serveur :", error);
    //         return res.status(500).json({ erreur: "Erreur serveur" });
    //     }
    // };
    

const updateUtilisateur = async (req, res) => {
    try {
        const { id, status, actif, nom, prenom, email, whatsapp,pays, password } = req.body;
        const date = new Date();

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        // Construire l'objet de mise à jour
        const Utilisateur = {};
        if (actif === 1 || actif === 0) Utilisateur.actif = actif;
        if (status !== undefined) Utilisateur.status = status;
        if (nom) Utilisateur.nom = nom;
        if (prenom) Utilisateur.prenom = prenom;
        if (email) Utilisateur.email = email;
        if (whatsapp) Utilisateur.whatsapp = whatsapp;
        if (pays) Utilisateur.pays = pays;
        Utilisateur.updated_at = date;

        // Hachage du mot de passe s'il est fourni
        if (password) {
            Utilisateur.password = await bcrypt.hash(password, 10);
        }

        // Vérification s'il y a des données à mettre à jour
        if (Object.keys(Utilisateur).length === 1) { 
            return res.status(400).json({ erreur: "Aucune donnée à mettre à jour" });
        }

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE users SET ? WHERE id = ?';
            connection.query(updateQuery, [Utilisateur, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de l'utilisateur :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de l'utilisateur" });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                }

                console.log("Utilisateur mis à jour avec succès.");
                return res.status(200).json({ message: "Mise à jour réussie", result });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

    const detailUtilisateur = async (req, res) => {
        try {
            const id = req.body.id;
    
            connecter((error, connection) => {
                if (error) {
                    console.error("Erreur lors de la connexion à la base de données :", error);
                    return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
                }
    
                connection.query('SELECT * FROM users WHERE id = ?', [id], (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération du Utilisateur :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération du Utilisateur" });
                    } else {
                        if (result.length === 0) {
                            return res.status(404).json({ erreur: "Utilisateur non trouvé" });
                        }
                        return res.status(200).json(result[0]); // Renvoie les données combinées
                    }
                });
            });
        } catch (error) {
            console.error("Erreur serveur :", error);
            return res.status(500).json({ erreur: "Erreur serveur" });
        }
    };
    
    const deleteUtilisateur = async (req, res) => {
        try {
            const id = req.body.id;
    
            connecter((error, connection) => {
                if (error) {
                    console.error("Erreur lors de la connexion à la base de données :", error);
                    return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
                }
    
                connection.query('DELETE FROM users WHERE id = ?', [id], (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération de la catégorie :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération de la catégorie" });
                    } else {
                        return res.status(200).json(result);
                    }
                });
            });
        } catch (error) {
            console.error("Erreur serveur :", error);
            return res.status(500).json({ erreur: "Erreur serveur" });
        }
    };
    
 
  
 module.exports = { 
        ajouterUtilisateur,
        listallUtilisateur,
        detailUtilisateur,
        deleteUtilisateur,
        detailUserconnectUtilisateur,
        updateUtilisateur
 };
    