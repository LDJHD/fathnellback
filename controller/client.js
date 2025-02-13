const { connecter } = require("./bd/connect");

const ajouterClient = async (req, res) => {
    try {
        const date=new Date();
        const client = {
            nom: req.body.nom,
            prenom: req.body.prenom,
            email: req.body.email,
            telephone: req.body.telephone,
            adresse: req.body.adresse,
            ifu: req.body.ifu,
            created_at:date,
            updated_at:date
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO client SET ?', client, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de l'client :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de client" });
                } else {
                    console.log("client ajouté avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}


const listallClient = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT id,nom,prenom,email,telephone,adresse,ifu,DATE_FORMAT(created_at, "%d/%m/%Y %H:%i:%s") AS date FROM client', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des clients :", erreur);
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


const listUserClient = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const userid=req.user.id;

            connection.query('SELECT * FROM client ', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des clients de l'user :", erreur);
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

const updateClient = async (req, res) => {
    try {
        const { id,  nom,
            prenom,
            email,
            telephone,
            adresse,
        ifu } = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const client = {
            nom,
            prenom,
            email,
            telephone,
            adresse,
            ifu,
            updated_at: date,
        };
        
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE client SET ? WHERE id = ? ';
            connection.query(updateQuery, [client, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de client :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de client" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("client mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const detailClient = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM client WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération du client :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du client" });
                } else {
                    if (result.length === 0) {
                        return res.status(404).json({ erreur: "client non trouvé" });
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

const deleteClient = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM client WHERE id = ?', [id], (erreur, result) => {
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

const getClientCount = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Requête pour compter le nombre de clients
            connection.query('SELECT COUNT(*) AS total FROM client', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors du comptage des clients :", erreur);
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
    ajouterClient,
    listallClient,
    detailClient,
    deleteClient,
    listUserClient,
    updateClient,
    getClientCount
 };
