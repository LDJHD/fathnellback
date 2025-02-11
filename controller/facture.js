const { connecter } = require("../bd/connect");

const ajouterFacture = async (req, res) => {
    try {
        const date=new Date();
        const facture = {
            vente_id: req.body.vente_id,
            montant_total: req.body.montant_total,
            tva: req.body.tva,
            remise: req.body.remise,
            montant_paye: req.body.montant_paye,
            montant_restant: req.body.montant_restant,
            mode_paiement: req.body.mode_paiement,
            client_id: req.body.client_id,
            created_at:date,
            updated_at:date
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO facture SET ?', facture, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de l'facture :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de facture" });
                } else {
                    console.log("facture ajouté avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}


const listallFacture = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM facture', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des factures :", erreur);
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


const listUserFacture = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const userid=req.user.id;

            connection.query('SELECT * FROM facture ', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des factures de l'user :", erreur);
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

const updateFacture = async (req, res) => {
    try {
        const { id,message } = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const facture = {
            vente_id: req,
            montant_total,
            tva,
            remise,
            montant_paye,
            montant_restant,
            mode_paiement,
            client_id,
            updated_at: date,
        };
        
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE facture SET ? WHERE id = ? ';
            connection.query(updateQuery, [facture, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de facture :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de facture" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("facture mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

// const detailFacture = async (req, res) => {
//     try {
//         const id = req.body.id;

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             connection.query('SELECT * FROM facture WHERE vente_id = ?', [id], (erreur, result) => {
//                 if (erreur) {
//                     console.error("Erreur lors de la récupération de la catégorie :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de la récupération de la catégorie" });
//                 } else {
//                     return res.status(200).json(result);
//                 }
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };

const detailFacture = async (req, res) => {
    try {
        const vente_id = req.body.vente_id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }


            // Requête corrigée avec jointures et comptage des ventes
            const query = `
                SELECT 
                    factu.*, 
                    factura.pdf AS pdf,
                    factura.id AS facturation_id, 
                    c.nom AS clientnom,
                    c.prenom AS clientprenom,
                    c.ifu AS clientifu
                FROM 
                    facture factu
                LEFT JOIN 
                    facturation factura ON factu.id = factura.facture_id
                LEFT JOIN 
                    client c ON factu.client_id = c.id
                
                WHERE 
                    factu.vente_id = ?
            `;

            connection.query(query, [vente_id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de infos :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des infos" });
                }

                // Vérification si un stock a été trouvé
                if (result.length === 0) {
                    return res.status(404).json({ erreur: "facturation non trouvé" });
                }
                return res.status(200).json(result[0]); // Renvoie les données combinées
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const deleteFacture = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM facture WHERE id = ?', [id], (erreur, result) => {
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
    ajouterFacture,
    listallFacture,
    detailFacture,
    deleteFacture,
    listUserFacture,
    updateFacture
 };
