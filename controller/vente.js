const { connecter } = require("../bd/connect");

const ajouterVente = async (req, res) => {
    try {
        const date = new Date();
        const vente = {
            nom: req.body.nom,
            montant_total: req.body.montant_total,
            client_id: req.body.client_id,
            created_at: date,
            updated_at: date
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO vente SET ?', vente, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de l'vente :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de vente" });
                } else {
                    console.log("vente ajouté avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}

// const ajouterTransaction = async (req, res) => {
//     const { montant_total, client_id, items, facture, pdf,pdf2 } = req.body;
//     const date = new Date();

//     try {
//         // Vérification de la structure des items (tableau d'objets)
//         if (!Array.isArray(items) || items.length === 0) {
//             return res.status(400).json({ erreur: "Les éléments de la vente doivent être un tableau." });
//         }

//         // Connexion à la base de données avec un pool
//         connecter((error, connection) => {
//             if (error) {
//                 return res.status(500).json({ erreur: "Erreur de connexion à la base de données." });
//             }

//             // Commencer une transaction
//             connection.beginTransaction(async (err) => {
//                 if (err) {
//                     return res.status(500).json({ erreur: "Erreur de début de transaction." });
//                 }

//                 try {
//                     // 1. Insérer la vente
//                     const vente = {
//                         montant_total,
//                         client_id,
//                         created_at: date,
//                         updated_at: date,
//                     };

//                     connection.query('INSERT INTO vente SET ?', vente, (insertErr, insertResult) => {
//                         if (insertErr) {
//                             return connection.rollback(() => {
//                                 return res.status(500).json({ erreur: "Erreur lors de l'insertion de la vente." });
//                             });
//                         }

//                         const vente_id = insertResult.insertId;

//                         // 2. Insérer les détails de la vente (items)
//                         const detailsPromises = items.map((item) => {
//                             const detailsvente = {
//                                 vente_id,
//                                 produit_id: item.produit_id,
//                                 quantite: item.quantite,
//                                 prix_unitaire: item.prix_unitaire,
//                                 created_at: date,
//                                 updated_at: date,
//                             };
//                             return new Promise((resolve, reject) => {
//                                 connection.query('INSERT INTO details_vente SET ?', detailsvente, (err) => {
//                                     if (err) {
//                                         return reject(err);
//                                     }
//                                     resolve();
//                                 });
//                             });
//                         });

//                         // Attendre l'insertion de tous les détails de vente
//                         Promise.all(detailsPromises)
//                             .then(() => {
//                                 // 3. Insérer la facture
//                                 const factureData = {
//                                     vente_id,
//                                     montant_total: facture.montant_total,
//                                     tva: facture.tva,
//                                     remise: facture.remise || 0,
//                                     montant_paye: facture.montant_paye,
//                                     montant_restant: facture.montant_restant,
//                                     mode_paiement: facture.mode_paiement,
//                                     client_id,
//                                     created_at: date,
//                                     updated_at: date,
//                                 };

//                                 connection.query('INSERT INTO facture SET ?', factureData, (factureErr, factureResult) => {
//                                     if (factureErr) {
//                                         return connection.rollback(() => {
//                                             return res.status(500).json({ erreur: "Erreur lors de l'insertion de la facture." });
//                                         });
//                                     }

//                                     const facture_id = factureResult.insertId;

//                                     // 4. Enregistrer la facturation PDF
//                                     const facturation = {
//                                         facture_id,
//                                         pdf,
//                                         pdf2,
//                                         created_at: date,
//                                         updated_at: date,
//                                     };

//                                     connection.query('INSERT INTO facturation SET ?', facturation, (facturationErr) => {
//                                         if (facturationErr) {
//                                             return connection.rollback(() => {
//                                                 return res.status(500).json({ erreur: "Erreur lors de l'enregistrement de la facturation PDF." });
//                                             });
//                                         }

//                                         // 5. Commit de la transaction
//                                         connection.commit((commitErr) => {
//                                             if (commitErr) {
//                                                 return connection.rollback(() => {
//                                                     return res.status(500).json({ erreur: "Erreur lors du commit de la transaction." });
//                                                 });
//                                             }

//                                             // Réussite, transaction terminée

//                                             return res.status(200).json({ message: "Transaction effectuée avec succès." });
//                                         });
//                                     });
//                                 });
//                             })
//                             .catch((err) => {
//                                 // Erreur lors de l'insertion des détails de la vente
//                                 return connection.rollback(() => {
//                                     connection.release();
//                                     return res.status(500).json({ erreur: "Erreur lors de l'insertion des détails de vente." });
//                                 });
//                             });
//                     });
//                 } catch (err) {
//                     console.error("Erreur interne serveur:", err);
//                     return res.status(500).json({ erreur: "Erreur interne du serveur lors de l'exécution de la transaction." });
//                 }
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };

// const ajouterTransaction = async (req, res) => {
//     const { montant_total, client_id, items, facture, pdf, pdf2 } = req.body;
//     const date = new Date();

//     if (!Array.isArray(items) || items.length === 0) {
//         return res.status(400).json({ erreur: "Les éléments de la vente doivent être un tableau." });
//     }

//     connecter((error, pool) => {
//         if (error) {
//             return res.status(500).json({ erreur: "Erreur de connexion à la base de données." });
//         }

//         pool.getConnection((err, connection) => {
//             if (err) {
//                 return res.status(500).json({ erreur: "Impossible d'obtenir une connexion à la base de données." });
//             }

//             connection.beginTransaction(async (transactionErr) => {
//                 if (transactionErr) {
//                     connection.release();
//                     return res.status(500).json({ erreur: "Erreur de début de transaction." });
//                 }

//                 try {
//                     // 1. Insérer la vente
//                     const vente = {
//                         montant_total,
//                         client_id,
//                         created_at: date,
//                         updated_at: date,
//                     };

//                     const [venteResult] = await queryAsync(connection, 'INSERT INTO vente SET ?', vente);
//                     const vente_id = venteResult.insertId;

//                     // 2. Insérer les détails de la vente
//                     const detailsPromises = items.map((item) => {
//                         const detailsvente = {
//                             vente_id,
//                             produit_id: item.produit_id,
//                             quantite: item.quantite,
//                             prix_unitaire: item.prix_unitaire,
//                             created_at: date,
//                             updated_at: date,
//                         };
//                         return queryAsync(connection, 'INSERT INTO details_vente SET ?', detailsvente);
//                     });

//                     await Promise.all(detailsPromises);

//                     // 3. Insérer la facture
//                     const factureData = {
//                         vente_id,
//                         montant_total: facture.montant_total,
//                         tva: facture.tva,
//                         remise: facture.remise || 0,
//                         montant_paye: facture.montant_paye,
//                         montant_restant: facture.montant_restant,
//                         mode_paiement: facture.mode_paiement,
//                         client_id,
//                         created_at: date,
//                         updated_at: date,
//                     };

//                     const [factureResult] = await queryAsync(connection, 'INSERT INTO facture SET ?', factureData);
//                     const facture_id = factureResult.insertId;

//                     // 4. Enregistrer la facturation PDF
//                     const facturation = {
//                         facture_id,
//                         pdf,
//                         pdf2,
//                         created_at: date,
//                         updated_at: date,
//                     };

//                     await queryAsync(connection, 'INSERT INTO facturation SET ?', facturation);

//                     // 5. Commit de la transaction
//                     await connection.commit();
//                     connection.release();

//                     return res.status(200).json({ message: "Transaction effectuée avec succès." });

//                 } catch (error) {
//                     connection.rollback(() => {
//                         connection.release();
//                         return res.status(500).json({ erreur: "Erreur lors de l'exécution de la transaction." });
//                     });
//                 }
//             });
//         });
//     });
// };


const ajouterTransaction = async (req, res) => {
    const { montant_total, client_id, items, facture, pdf, pdf2 ,invoice_id} = req.body;
    const date = new Date();

    // Vérifier que items est bien un tableau
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ erreur: "Les éléments de la vente doivent être un tableau." });
    }

    connecter((error, pool) => {
        if (error) {
            return res.status(500).json({ erreur: "Erreur de connexion à la base de données." });
        }

        pool.getConnection((err, connection) => {
            if (err) {
                return res.status(500).json({ erreur: "Impossible d'obtenir une connexion à la base de données." });
            }

            connection.beginTransaction(async (err) => {
                if (err) {
                    connection.release();
                    return res.status(500).json({ erreur: "Erreur de début de transaction." });
                }

                try {
                    // 1️⃣ Insérer la vente
                    const vente = { montant_total, client_id, created_at: date, updated_at: date,invoice_id };

                    connection.query('INSERT INTO vente SET ?', vente, (insertErr, insertResult) => {
                        if (insertErr) {
                            return connection.rollback(() => {
                                connection.release();
                                return res.status(500).json({ erreur: "Erreur lors de l'insertion de la vente." });
                            });
                        }

                        const vente_id = insertResult.insertId;

                        // 2️⃣ Insérer les détails de vente
                        const detailsPromises = items.map((item) => {
                            return new Promise((resolve, reject) => {
                                const detailsvente = {
                                    vente_id,
                                    produit_id: item.produit_id,
                                    quantite: item.quantite,
                                    prix_unitaire: item.prix_unitaire,
                                    created_at: date,
                                    updated_at: date,
                                };
                                connection.query('INSERT INTO details_vente SET ?', detailsvente, (err) => {
                                    if (err) return reject(err);
                                    resolve();
                                });
                            });
                        });

                        Promise.all(detailsPromises)
                            .then(() => {
                                // 3️⃣ Insérer la facture
                                const factureData = {
                                    vente_id,
                                    montant_total: facture.montant_total,
                                    tva: facture.tva,
                                    remise: facture.remise || 0,
                                    montant_paye: facture.montant_paye,
                                    montant_restant: facture.montant_restant,
                                    mode_paiement: facture.mode_paiement,
                                    client_id,
                                    created_at: date,
                                    updated_at: date,
                                };

                                connection.query('INSERT INTO facture SET ?', factureData, (factureErr, factureResult) => {
                                    if (factureErr) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            return res.status(500).json({ erreur: "Erreur lors de l'insertion de la facture." });
                                        });
                                    }

                                    const facture_id = factureResult.insertId;

                                    // 4️⃣ Enregistrer la facturation PDF
                                    const facturation = { facture_id, pdf, pdf2, created_at: date, updated_at: date };

                                    connection.query('INSERT INTO facturation SET ?', facturation, (facturationErr) => {
                                        if (facturationErr) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                return res.status(500).json({ erreur: "Erreur lors de l'enregistrement de la facturation PDF." });
                                            });
                                        }

                                        // 5️⃣ Commit et libérer la connexion
                                        connection.commit((commitErr) => {
                                            if (commitErr) {
                                                return connection.rollback(() => {
                                                    connection.release();
                                                    return res.status(500).json({ erreur: "Erreur lors du commit de la transaction." });
                                                });
                                            }

                                            connection.release();
                                            return res.status(200).json({ message: "Transaction effectuée avec succès." });
                                        });
                                    });
                                });
                            })
                            .catch((err) => {
                                connection.rollback(() => {
                                    connection.release();
                                    return res.status(500).json({ erreur: "Erreur lors de l'insertion des détails de vente." });
                                });
                            });
                    });
                } catch (err) {
                    connection.rollback(() => {
                        connection.release();
                        return res.status(500).json({ erreur: "Erreur interne du serveur lors de l'exécution de la transaction." });
                    });
                }
            });
        });
    });
};


// Fonction utilitaire pour exécuter des requêtes SQL avec des Promises
function queryAsync(connection, sql, params) {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (error, results) => {
            if (error) {
                return reject(error);
            }
            resolve(results);
        });
    });
}






const listallVente = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Requête SQL corrigée
            const query = `
SELECT 
    v.*, 
    c.id AS idlient,
    c.nom AS client,
    d.id AS d_id,
    DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i:%s') AS date
FROM 
     vente v
LEFT JOIN 
    client c ON v.client_id = c.id
    LEFT JOIN 
    details_vente d ON v.id = d.vente_id
GROUP BY 
    v.id
`;

            connection.query(query, (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des ventes :", erreur);
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


// const listVentesearch = async (req, res) => {
//     try {
//         const { valeur } = req.body; // Une seule valeur envoyée

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             // Requête SQL ajustée pour rechercher des groupes de mots exacts
//             const query = `
//                 SELECT 
//                     v.*, 
//                     c.id AS idclient,
//                     c.nom AS client,
//                     c.prenom AS prenom,
//                     c.ifu AS ifu,
//                     d.id AS d_id,
//                     DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i:%s') AS date
//                 FROM 
//                     vente v
//                 LEFT JOIN 
//                     client c ON v.client_id = c.id
//                 LEFT JOIN 
//                     details_vente d ON v.id = d.vente_id
//                 WHERE 
//                     c.nom LIKE CONCAT('%', ?, '%') 
//                     OR c.prenom LIKE CONCAT('%', ?, '%') 
//                     OR c.ifu LIKE CONCAT('%', ?, '%')
//             `;

//             // Appliquer la même valeur pour toutes les colonnes si vous recherchez un groupe de mots partout
//             const values = [valeur, valeur, valeur];

//             connection.query(query, values, (erreur, result) => {
//                 if (erreur) {
//                     console.error("Erreur lors de la récupération des clients :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de la récupération des produits" });
//                 }

//                 if (result.length === 0) {
//                     return res.status(404).json({ message: "Aucun client trouvé" });
//                 }

//                 return res.status(200).json(result);
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };


const listVentesearch = async (req, res) => {
    try {
        const { valeur, dateDebut, dateFin } = req.body; // Valeur et plages de dates envoyées

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Construire la requête SQL avec la condition pour les dates
            let query = `
                SELECT 
                    v.*, 
                    c.id AS idclient,
                    c.nom AS client,
                    c.prenom AS prenom,
                    c.ifu AS ifu,
                    d.id AS d_id,
                    DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i:%s') AS date
                FROM 
                    vente v
                LEFT JOIN 
                    client c ON v.client_id = c.id
                LEFT JOIN 
                    details_vente d ON v.id = d.vente_id
                WHERE 
                    (c.nom LIKE CONCAT('%', ?, '%') 
                    OR c.prenom LIKE CONCAT('%', ?, '%') 
                    OR c.ifu LIKE CONCAT('%', ?, '%'))
            `;

            const values = [valeur, valeur, valeur];

            // Ajouter les conditions pour la plage de dates si elles sont présentes
            if (dateDebut && dateFin) {
                query += ` AND DATE(v.created_at) BETWEEN ? AND ?`;
                values.push(dateDebut, dateFin); // Ajout des dates aux paramètres
            }

            connection.query(query, values, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des clients :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des produits" });
                }

                if (result.length === 0) {
                    return res.status(404).json({ message: "Aucun client trouvé" });
                }

                return res.status(200).json(result);
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

// const listVenteProduitsearchSom = async (req, res) => {
//     try {
//       const { valeur, dateDebut, dateFin, produit } = req.body; // Valeur et plages de dates envoyées
  
//       connecter((error, connection) => {
//         if (error) {
//           console.error("Erreur lors de la connexion à la base de données :", error);
//           return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//         }
  
//         // Construire la requête SQL de base
//         let query = `
//           SELECT 
//             v.id AS vente_id,
//             COUNT(vente_id) AS nombrevente,
//             v.montant_total,
//             c.id AS client_id,
//             c.nom AS client,
//             c.prenom AS prenom,
//             c.ifu AS ifu,
//             d.produit_id AS produit_id,
//             d.quantite AS quantite,
//             d.prix_unitaire AS prix_unitaire,
//             DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i:%s') AS date
//           FROM 
//             vente v
//           LEFT JOIN 
//             client c ON v.client_id = c.id
//           LEFT JOIN 
//             details_vente d ON v.id = d.vente_id
//           WHERE 
//             (c.nom LIKE CONCAT('%', ?, '%') 
//             OR c.prenom LIKE CONCAT('%', ?, '%') 
//             OR c.ifu LIKE CONCAT('%', ?, '%'))
//         `;
  
//         const values = [valeur, valeur, valeur];
  
//         // Ajouter la condition pour la plage de dates si elle est définie
//         if (dateDebut && dateFin) {
//           query += ` AND DATE(v.created_at) BETWEEN ? AND ?`;
//           values.push(dateDebut, dateFin);
//         }
  
//         connection.query(query, values, (erreur, result) => {
//           if (erreur) {
//             console.error("Erreur lors de la récupération des clients :", erreur);
//             return res.status(500).json({ erreur: "Erreur lors de la récupération des produits" });
//           }
  
//           if (result.length === 0) {
//             return res.status(404).json({ message: "Aucun enregistrement trouvé" });
//           }
  
//           // Calculer la somme des montants totaux pour toutes les ventes
//           const totalMontant = result.reduce((sum, row) => sum + (row.montant_total || 0), 0);
  
//           // Si une recherche par produit est spécifiée, calculer la somme des prix unitaire * quantité
//           let totalProduit = null;
//           if (produit) {
//             totalProduit = result
//               .filter(row => row.produit_id === parseInt(produit, 10)) // Filtrer les enregistrements pour le produit spécifié
//               .reduce((sum, row) => sum + (row.prix_unitaire * row.quantite || 0), 0);
//           }
  
//           // Réponse avec les données calculées
//           return res.status(200).json({
//             result,
//             totalMontant,
//             totalProduit,
//             message: totalProduit !== null 
//               ? `Somme des montants totaux et des prix pondérés calculés avec succès` 
//               : `Somme des montants totaux calculée avec succès`
//           });
//         });
//       });
//     } catch (error) {
//       console.error("Erreur serveur :", error);
//       return res.status(500).json({ erreur: "Erreur serveur" });
//     }
//   };


// const listVenteProduitsearchSom = async (req, res) => {
//     try {
//       const { valeur, dateDebut, dateFin, produit } = req.body;
  
//       connecter((error, connection) => {
//         if (error) {
//           console.error("Erreur de connexion à la base de données :", error);
//           return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
//         }
  
//         // Requête principale pour les ventes
//         let query = `
//           SELECT 
//           v.*,
//             COUNT(*) AS nombre_ventes,
//             SUM(v.montant_total) AS total_montant,
//             c.id AS client_id,
//             c.nom AS client,
//             c.prenom AS prenom,
//             c.ifu AS ifu,
//             DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i:%s') AS date
//           FROM 
//             vente v
//           LEFT JOIN 
//             client c ON v.client_id = c.id
//           WHERE 
//             (c.nom LIKE CONCAT('%', ?, '%') 
//             OR c.prenom LIKE CONCAT('%', ?, '%') 
//             OR c.ifu LIKE CONCAT('%', ?, '%'))
//             AND (? IS NULL OR DATE(v.created_at) BETWEEN ? AND ?)
//             GROUP BY 
//             v.id;
           
//         `;

  
//         const values = [valeur, valeur, valeur, dateDebut || null, dateDebut, dateFin];
  
//         connection.query(query, values, (err, ventes) => {
//           if (err) {
//             console.error("Erreur lors de la récupération des ventes :", err);
//             return res.status(500).json({ erreur: "Erreur lors de la récupération des ventes" });
//           }
  
//           if (ventes.length === 0) {
//             return res.status(404).json({ message: "Aucun enregistrement trouvé" });
//           }
  
//           // Calcul du montant total des ventes
//           const totalMontant = ventes.reduce((sum, vente) => sum + (vente.total_montant || 0), 0);
//           const totalEnregistrement = ventes.length; // Nombre total d'enregistrements retournés
  
//           // Si un produit est spécifié, récupérer son total séparément
//           if (produit) {
//             const produitQuery = `
//               SELECT 
//                 SUM(d.prix_unitaire * d.quantite) AS total_produit
//               FROM 
//                 details_vente d
//               WHERE 
//                 d.produit_id = ?;
//             `;
  
//             connection.query(produitQuery, [produit], (errProduit, produitResult) => {
//               if (errProduit) {
//                 console.error("Erreur lors de la récupération du produit :", errProduit);
//                 return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
//               }
  
//               const totalProduit = produitResult[0]?.total_produit || 0;
  
//               // Répondre avec toutes les données
//               return res.status(200).json({
//                 ventes,
//                 totalMontant,
//                 totalProduit,
//                 totalEnregistrement,
//                 message: "Données calculées avec succès"
//               });
//             });
//           } else {
//             // Répondre sans calcul supplémentaire
//             return res.status(200).json({
//               ventes,
//               totalMontant,
//               totalEnregistrement,
//               message: "Données calculées avec succès"
//             });
//           }
//         });
//       });
//     } catch (error) {
//       console.error("Erreur serveur :", error);
//       return res.status(500).json({ erreur: "Erreur serveur" });
//     }
//   };
  
// const listVenteProduitsearchSom = async (req, res) => {
//     try {
//         const { valeur, dateDebut, dateFin, produit } = req.body;

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur de connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
//             }

//             // Requête principale pour les ventes
//             let query = `
//                 SELECT 
//                     v.*,
//                     COUNT(*) AS nombre_ventes,
//                     SUM(v.montant_total) AS total_montant,
//                     c.id AS client_id,
//                     c.nom AS client,
//                     c.prenom AS prenom,
//                     c.ifu AS ifu,
//                     DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i:%s') AS date
//                 FROM vente v
//                 LEFT JOIN client c ON v.client_id = c.id
//                 WHERE 
//                     (c.nom LIKE CONCAT('%', ?, '%') 
//                     OR c.prenom LIKE CONCAT('%', ?, '%') 
//                     OR c.ifu LIKE CONCAT('%', ?, '%'))
//                     AND (? IS NULL OR DATE(v.created_at) BETWEEN ? AND ?)
//                 GROUP BY v.id;
//             `;

//             const values = [valeur, valeur, valeur, dateDebut || null, dateDebut, dateFin];

//             connection.query(query, values, (err, ventes) => {
//                 if (err) {
//                     console.error("Erreur lors de la récupération des ventes :", err);
//                     return res.status(500).json({ erreur: "Erreur lors de la récupération des ventes" });
//                 }

//                 if (ventes.length === 0) {
//                     return res.status(404).json({ message: "Aucun enregistrement trouvé" });
//                 }

//                 // Calcul du montant total des ventes
//                 const totalMontant = ventes.reduce((sum, vente) => sum + (vente.total_montant || 0), 0);
//                 const totalEnregistrement = ventes.length;

//                 // Requêtes pour récupérer les sommes demandées
//                 const querySommes = `
//                     SELECT 
//                         (SELECT COALESCE(SUM(montant_total), 0) FROM vente WHERE DATE(created_at) = CURRENT_DATE()) AS ceJour,
//                         (SELECT COALESCE(SUM(montant_total), 0) FROM vente WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) AS septJour,
//                         (SELECT COALESCE(SUM(montant_total), 0) FROM vente WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) AS trenteDerniersJours
//                 `;

//                 connection.query(querySommes, (errSommes, resultSommes) => {
//                     if (errSommes) {
//                         console.error("Erreur lors du calcul des sommes :", errSommes);
//                         return res.status(500).json({ erreur: "Erreur lors du calcul des sommes" });
//                     }

//                     const { ceJour, septJour, trenteDerniersJours } = resultSommes[0];

//                     // Si un produit est spécifié, récupérer son total séparément
//                     if (produit) {
//                         const produitQuery = `
//                             SELECT 
//                                 SUM(d.prix_unitaire * d.quantite) AS total_produit
//                             FROM 
//                                 details_vente d
//                             WHERE 
//                                 d.produit_id = ?;
//                         `;

//                         connection.query(produitQuery, [produit], (errProduit, produitResult) => {
//                             if (errProduit) {
//                                 console.error("Erreur lors de la récupération du produit :", errProduit);
//                                 return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
//                             }

//                             const totalProduit = produitResult[0]?.total_produit || 0;

//                             // Répondre avec toutes les données
//                             return res.status(200).json({
//                                 ventes,
//                                 totalMontant,
//                                 totalProduit,
//                                 totalEnregistrement,
//                                 ceJour,
//                                 septJour,
//                                 trenteDerniersJours,
//                                 message: "Données calculées avec succès"
//                             });
//                         });
//                     } else {
//                         // Répondre sans calcul supplémentaire
//                         return res.status(200).json({
//                             ventes,
//                             totalMontant,
//                             totalEnregistrement,
//                             ceJour,
//                             septJour,
//                             trenteDerniersJours,
//                             message: "Données calculées avec succès"
//                         });
//                     }
//                 });
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };

const listVenteProduitsearchSom = async (req, res) => {
    try {
        const { valeur, dateDebut, dateFin, produit } = req.body;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur de connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
            }

            // Requête principale pour les ventes
            let query = `
                SELECT 
                    v.*,
                    COUNT(*) AS nombre_ventes,
                    SUM(v.montant_total) AS total_montant,
                    c.id AS client_id,
                    c.nom AS client,
                    c.prenom AS prenom,
                    c.ifu AS ifu,
                    DATE_FORMAT(v.created_at, '%d/%m/%Y %H:%i:%s') AS date
                FROM 
                    vente v
                LEFT JOIN 
                    client c ON v.client_id = c.id
                WHERE 
                    (c.nom LIKE CONCAT('%', ?, '%') 
                    OR c.prenom LIKE CONCAT('%', ?, '%') 
                    OR c.ifu LIKE CONCAT('%', ?, '%'))
                    AND (? IS NULL OR DATE(v.created_at) BETWEEN ? AND ?)
                GROUP BY 
                    v.id;
            `;

            const values = [valeur, valeur, valeur, dateDebut || null, dateDebut, dateFin];

            connection.query(query, values, (err, ventes) => {
                if (err) {
                    console.error("Erreur lors de la récupération des ventes :", err);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des ventes" });
                }

                if (!ventes || ventes.length === 0) {
                    return res.status(200).json({
                        ventes: [],
                       
                        message: "Aucun enregistrement trouvé"
                    });
                }

                // Calcul du montant total des ventes
                const totalMontant = ventes.reduce((sum, vente) => sum + (vente.total_montant || 0), 0);
                const totalEnregistrement = ventes.length;

                // Requêtes pour les statistiques supplémentaires
                const statsQuery = `
                    SELECT 
                        SUM(CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN montant_total ELSE 0 END) AS septJour,
                        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN montant_total ELSE 0 END) AS ceJour,
                        SUM(CASE WHEN created_at >= NOW() - INTERVAL 30 DAY THEN montant_total ELSE 0 END) AS trenteDerniersJours,
                        SUM(montant_total) AS totalMontantDefaut,
                        COUNT(*) AS totalEnregistrementDefaut
                    FROM vente;
                `;

                connection.query(statsQuery, (errStats, stats) => {
                    if (errStats) {
                        console.error("Erreur lors de la récupération des statistiques :", errStats);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération des statistiques" });
                    }

                    const { septJour, ceJour, trenteDerniersJours, totalMontantDefaut, totalEnregistrementDefaut } = stats[0];

                    if (produit) {
                        const produitQuery = `
                            SELECT 
                                SUM(d.prix_unitaire * d.quantite) AS total_produit
                            FROM 
                                details_vente d
                            WHERE 
                                d.produit_id = ?;
                        `;

                        connection.query(produitQuery, [produit], (errProduit, produitResult) => {
                            if (errProduit) {
                                console.error("Erreur lors de la récupération du produit :", errProduit);
                                return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
                            }

                            const totalProduit = produitResult[0]?.total_produit || 0;

                            return res.status(200).json({
                                ventes,
                                totalMontant,
                                totalProduit,
                                totalEnregistrement,
                                septJour,
                                ceJour,
                                trenteDerniersJours,
                                totalMontantDefaut,
                                totalEnregistrementDefaut,
                                message: "Données calculées avec succès"
                            });
                        });
                    } else {
                        return res.status(200).json({
                            ventes,
                            totalMontant,
                            totalEnregistrement,
                            septJour,
                            ceJour,
                            trenteDerniersJours,
                            totalMontantDefaut,
                            totalEnregistrementDefaut,
                            message: "Données calculées avec succès"
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};



  


const listUserVente = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const userid = req.user.id;

            connection.query('SELECT * FROM vente ', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des ventes de l'user :", erreur);
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

const updateVente = async (req, res) => {
    try {
        const { id, message } = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const vente = {
            nom,
            prenom,
            email,
            telephone,
            updated_at: date,
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE vente SET ? WHERE id = ? ';
            connection.query(updateQuery, [vente, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de vente :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de vente" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("vente mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const detailVente = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }


            // Requête corrigée avec jointures et comptage des ventes
            const query = `
                SELECT 
                    d.*, 
                    v.montant_total AS total,
                    p.nom AS nom_produit, 
                    COUNT(d.vente_id) AS total_ventes
                FROM 
                    details_vente d
                LEFT JOIN 
                    produit p ON d.produit_id = p.id
                LEFT JOIN 
                    vente v ON d.vente_id = v.id
                WHERE 
                    d.vente_id = ?
                GROUP BY 
                    d.id
            `;

            connection.query(query, [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération du stock :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du stock" });
                }

                // Vérification si un stock a été trouvé
                if (result.length === 0) {
                    return res.status(404).json({ erreur: "vente non trouvé" });
                }
                return res.status(200).json(result); // Renvoie les données combinées
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const deleteVente = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM vente WHERE id = ?', [id], (erreur, result) => {
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

const getventedayCount = async (req, res) => {
    try {
        const date = new Date().toISOString().split('T')[0]; // Obtenir la date au format 'YYYY-MM-DD'

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Requête pour calculer la somme de montant_total pour la date actuelle
            connection.query(
                'SELECT COUNT(*) AS total FROM vente WHERE DATE(created_at) = ?',
                [date],
                (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération des ventes :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération des ventes" });
                    } else {
                        return res.status(200).json({ total: result[0].total || 0 }); // Retourne la somme ou 0 si aucune donnée
                    }
                }
            );
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const getventemontantdayCount = async (req, res) => {
    try {
        const date = new Date().toISOString().split('T')[0]; // Obtenir la date au format 'YYYY-MM-DD'

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Requête pour calculer la somme de montant_total pour la date actuelle
            connection.query(
                'SELECT SUM(montant_total) AS total FROM vente WHERE DATE(created_at) = ?',
                [date],
                (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération des ventes :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération des ventes" });
                    } else {
                        return res.status(200).json({ total: result[0].total || 0 }); // Retourne la somme ou 0 si aucune donnée
                    }
                }
            );
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};




module.exports = {
    ajouterVente,
    ajouterTransaction,
    listallVente,
    detailVente,
    deleteVente,
    listUserVente,
    updateVente,
    getventedayCount,
    getventemontantdayCount,
    listVentesearch,
    listVenteProduitsearchSom
};
