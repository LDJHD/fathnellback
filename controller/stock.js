const { connecter } = require("../bd/connect");
const { verifierProduitExistant } = require('../utils/helpers');


const ajouterStock = async (req, res) => {
    try {
        const { produit_id, quantite_stock } = req.body;
        const date = new Date();

        connecter(async (error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            try {
                // Vérifier si le produit existe
                await verifierProduitExistant(connection, produit_id);

                // Si le produit existe, continuer avec la gestion du stock
                const querySelect = `SELECT * FROM stock WHERE produit_id = ?`;
                connection.query(querySelect, [produit_id], (err, results) => {
                    if (err) {
                        console.error("Erreur lors de la vérification du stock :", err);
                        return res.status(500).json({ erreur: "Erreur lors de la vérification du stock" });
                    }

                    if (results.length > 0) {
                        // Mise à jour du stock existant
                        const queryUpdate = `UPDATE stock SET quantite_stock = ?, updated_at = ? WHERE produit_id = ?`;
                        connection.query(queryUpdate, [quantite_stock, date, produit_id], (err) => {
                            if (err) {
                                console.error("Erreur lors de la mise à jour du stock :", err);
                                return res.status(500).json({ erreur: "Erreur lors de la mise à jour du stock" });
                            }
                            console.log("Stock mis à jour avec succès.");
                            return res.status(200).json({ message: "Stock mis à jour avec succès." });
                        });
                    } else {
                        // Ajout d'un nouveau stock
                        const queryInsert = `INSERT INTO stock (produit_id, quantite_stock, statut, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`;
                        connection.query(queryInsert, [produit_id, quantite_stock, "stock", date, date], (err) => {
                            if (err) {
                                console.error("Erreur lors de l'ajout du stock :", err);
                                return res.status(500).json({ erreur: "Erreur lors de l'ajout du stock" });
                            }
                            console.log("Stock ajouté avec succès.");
                            return res.status(201).json({ message: "Stock ajouté avec succès." });
                        });
                    }
                });
            } catch (err) {
                console.error(err.message);
                return res.status(400).json({ erreur: err.message });
            }
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};



const listallStock = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Requête SQL corrigée
            const query = `
                SELECT 
                    s.*, 
                    p.nom AS nom_produit,
                    c.nom AS categorie,
                    COUNT(d.id) AS vendu, -- Comptage des ventes pour ce produit
                    DATE_FORMAT(s.created_at, '%d/%m/%Y %H:%i:%s') AS date_creation
                FROM 
                    stock s
                LEFT JOIN 
                    produit p ON s.produit_id = p.id
                     LEFT JOIN 
                    categorie c ON p.categorie_id = c.id
                     LEFT JOIN 
                    details_vente d ON d.produit_id = p.id
                GROUP BY 
                    s.id, p.nom
            `;

            connection.query(query, (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des stocks :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des stocks" });
                }

                // Retourner les résultats sous forme de JSON
                return res.status(200).json(results);
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};




const detailStock = async (req, res) => {
    try {
        const { id } = req.body;

        // Vérification de la validité de l'ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ erreur: "ID invalide ou manquant" });
        }

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Requête corrigée avec jointures et comptage des ventes
            const query = `
                SELECT 
                    s.*, 
                    p.id AS p_id,
                    p.nom AS nom_produit, 
                    COUNT(d.id) AS total_ventes
                FROM 
                    stock s
                LEFT JOIN 
                    produit p ON s.produit_id = p.id
                LEFT JOIN 
                    details_vente d ON p.id = d.produit_id
                WHERE 
                    s.id = ?
                GROUP BY 
                    s.id, p.nom
            `;

            connection.query(query, [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération du stock :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du stock" });
                }

                // Vérification si un stock a été trouvé
                if (result.length === 0) {
                    return res.status(404).json({ erreur: "Stock non trouvé" });
                }
                return res.status(200).json(result[0]); // Renvoie les données combinées
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


// const valeurStock = async (req, res) => {
//     try {
//         const { id } = req.body;

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             connection.query('SELECT quantite_stock FROM stock WHERE produit_id = ?', [id], (erreur, result) => {
//                 if (erreur) {
//                     console.error("Erreur lors de la récupération de la quantité en stock :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de la récupération de la quantité en stock" });
//                 }

//                 if (result.length === 0) {
//                     return res.status(404).json({ erreur: "Aucune donnée trouvée pour cet ID de produit" });
//                 }

//                 return res.status(200).json({ quantite_stock: result[0].quantite_stock });
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };

const valeurStock = async (req, res) => {
    try {
        const { id } = req.body;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Effectuer une requête pour obtenir la quantité en stock de la table stock
            connection.query('SELECT quantite_stock FROM stock WHERE produit_id = ?', [id], (erreur, resultStock) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la quantité en stock :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la quantité en stock" });
                }

                if (resultStock.length === 0) {
                    return res.status(404).json({ erreur: "Aucune donnée trouvée pour cet ID de produit dans la table stock" });
                }

                // Quantité en stock de la table stock
                const quantiteStock = resultStock[0].quantite_stock;

                // Effectuer une requête pour obtenir la quantité vendue dans la table detail_vente
                connection.query('SELECT SUM(quantite) AS quantite_vendue FROM details_vente WHERE produit_id = ?', [id], (erreur, resultVente) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération de la quantité vendue :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération de la quantité vendue" });
                    }

                    // Si aucune vente n'a été enregistrée, la quantité vendue sera 0
                    const quantiteVendue = resultVente[0].quantite_vendue || 0;

                    // Calculer le stock restant
                    const stockRestant = quantiteStock - quantiteVendue;

                    // Retourner la quantité en stock et la quantité vendue
                    return res.status(200).json({
                        quantite_stock: quantiteStock,
                        quantite_vendue: quantiteVendue,
                        stock_restant: stockRestant,
                    });
                });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};



const deleteStock = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM stock WHERE id = ?', [id], (erreur, result) => {
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

const updateStock = async (req, res) => {
    try {
        const { id, quantite_stock } = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const stock = {
            quantite_stock,
            updated_at: date,
        };
      
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE stock SET ? WHERE id = ? ';
            connection.query(updateQuery, [stock, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de stock :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de stock" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("stock mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

module.exports = {
    ajouterStock,
    listallStock,
    detailStock,
    deleteStock,
    updateStock,
    valeurStock
};