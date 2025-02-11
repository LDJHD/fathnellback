const { connecter } = require("../bd/connect");

const ajouterFournisseur = async (req, res) => {
    try {
        const date=new Date();
        const fournisseur = {
            nom: req.body.nom,
            contact: req.body.contact,
            adresse: req.body.adresse,
            created_at:date,
            updated_at:date
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO fournisseur SET ?', fournisseur, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de l'fournisseur :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de fournisseur" });
                } else {
                    console.log("fournisseur ajouté avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}


const listallFournisseur = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT id,nom,contact,adresse,DATE_FORMAT(created_at, "%d/%m/%Y %H:%i:%s") AS date FROM fournisseur', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des fournisseurs :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des catégories" });
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


const listUserFournisseur = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const userid=req.user.id;

            connection.query('SELECT * FROM fournisseur ', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des fournisseurs de l'user :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des catégories" });
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

const updateFournisseur = async (req, res) => {
    try {
        const { id, nom,
            contact,
            adresse } = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const fournisseur = {
            nom,
            nom,
            contact,
            adresse,
            updated_at: date,
        };
        
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE fournisseur SET ? WHERE id = ? ';
            connection.query(updateQuery, [fournisseur, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de fournisseur :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de fournisseur" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("fournisseur mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const detailFournisseur = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM fournisseur WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération du fournisseur :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du client" });
                } else {
                    if (result.length === 0) {
                        return res.status(404).json({ erreur: "Fournisseur non trouvé" });
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

const deleteFournisseur = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM fournisseur WHERE id = ?', [id], (erreur, result) => {
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

const getfournisseurCount = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Requête pour compter le nombre de clients
            connection.query('SELECT COUNT(*) AS total FROM fournisseur', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors du comptage des fournisseurs :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors du comptage des clients" });
                }

                // Retourner le total des clients
                return res.status(200).json({ total: results[0].total });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


module.exports = { 
    ajouterFournisseur,
    listallFournisseur,
    detailFournisseur,
    deleteFournisseur,
    listUserFournisseur,
    updateFournisseur,
    getfournisseurCount
 };
