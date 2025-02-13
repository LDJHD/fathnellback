const { connecter } = require("./bd/connect");

const ajouterdetailCommande = async (req, res) => {
    try {
        const date=new Date();
        const detail_commande = {
            commande_id: req.body.commande_id,
            produit_id: req.body.produit_id,
            quantite: req.body.quantite,
            prix_unitaire: req.body.prix_unitaire,
            created_at:date,
            updated_at:date
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO detail_commande SET ?', detail_commande, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de l'detail_commande :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de detail_commande" });
                } else {
                    console.log("detail_commande ajouté avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}


const listalldetailCommande = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM detail_commande', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des detail_commandes :", erreur);
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


const listUserdetailCommande = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const userid=req.user.id;

            connection.query('SELECT * FROM detail_commande ', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des detail_commandes de l'user :", erreur);
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

const updatedetailCommande = async (req, res) => {
    try {
        const { id,message } = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const detail_commande = {
            commande_id,
            produit_id,
            quantite,
            prix_unitaire,
            updated_at: date,
        };
        
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE detail_commande SET ? WHERE id = ? ';
            connection.query(updateQuery, [detail_commande, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de detail_commande :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de detail_commande" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("detail_commande mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const detaildetailCommande = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM detail_commande WHERE id = ?', [id], (erreur, result) => {
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

const deletedetailCommande = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM detail_commande WHERE id = ?', [id], (erreur, result) => {
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
    ajouterdetailCommande,
    listalldetailCommande,
    detaildetailCommande,
    deletedetailCommande,
    listUserdetailCommande,
    updatedetailCommande
 };
