const { connecter } = require("../bd/connect");

// const ajouterProduit = async (req, res) => {
//     try {
//         const date = new Date;
//         const produit = {
//             nom: req.body.nom,
//             description: req.body.description,
//             categorie_id:req.body.categorie_id,
//             prix: req.body.prix,
//             code_barre:req.body.code_barre,
//             created_at: date,
//             updated_at: date
//         };

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             connection.query('INSERT INTO produit SET ?', produit, (erreur, result) => {
//                 if (erreur) {
//                     console.error("Erreur lors de l'ajout de produit :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de l'ajout de produit" });
//                 } else {
//                     console.log("produit ajouté avec succès.");
//                     return res.status(200).json(result);
//                 }
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// }

//Version utilisé recemment

// const ajouterProduit = async (req, res) => {
//     try {
//         const date = new Date();
//         const produit = {
//             nom: req.body.nom,
//             description: req.body.description,
//             categorie_id: req.body.categorie_id,
//             prix: req.body.prix,
//             prix_achat: req.body.prix_achat,
//             taxation: req.body.taxation,
//             dateexpi: req.body.dateexpi,
//             code_barre: req.body.code_barre,
//             created_at: date,
//             updated_at: date
//         };

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             connection.query('INSERT INTO produit SET ?', produit, (erreur, result) => {
//                 if (erreur) {
//                     console.error("Erreur lors de l'ajout de produit :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de l'ajout de produit" });
//                 }

//                 // Récupérer le produit inséré avec son ID
//                 const produitId = result.insertId;
//                 connection.query('SELECT * FROM produit WHERE id = ?', [produitId], (err, rows) => {
                  
//                     if (err) {
//                         console.error("Erreur lors de la récupération du produit :", err);
//                         return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
//                     }
                    
//                     if (rows.length > 0) {
//                         console.log("Produit ajouté avec succès :", rows[0]);
//                         return res.status(201).json(rows[0]); // Renvoie le produit créé
//                     } else {
//                         return res.status(404).json({ erreur: "Produit non trouvé après l'insertion" });
//                     }
//                 });
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };


// const listallProduit = async (req, res) => {
//     try {
//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             const query = `
//             SELECT 
//                 p.*, 
//                 c.nom AS nom_categorie,
//                 DATE_FORMAT(p.created_at, '%d/%m/%Y %H:%i:%s') AS date
//             FROM 
//                 produit p
//             LEFT JOIN 
//                 categorie c ON p.categorie_id = c.id
//             GROUP BY 
//                 p.id,p.nom
//         `;

//         connection.query(query, (erreur, results) => {
//                 if (erreur) {
//                     console.error("Erreur lors de la récupération des produits :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de la récupération des catégories" });
//                 } else {
//                     return res.status(200).json(results);
//                 }
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };

const ajouterProduit = async (req, res) => {
    try {
        const { code_barre, acceptdoublons } = req.body;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Vérifier si un produit avec le même code_barre existe
            connection.query('SELECT * FROM produit WHERE code_barre = ?', [code_barre], (err, produits) => {
                if (err) {
                    console.error("Erreur lors de la vérification du code barre :", err);
                    return res.status(500).json({ erreur: "Erreur lors de la vérification du code barre" });
                }

                if (produits.length > 0 && acceptdoublons != 1) {
                    // Si des produits existent déjà et que acceptdoublons n'est pas envoyé, on envoie la liste
                    return res.status(200).json({ existe: 1, produits });
                }

                // Si aucun produit n'existe ou que l'utilisateur a accepté le doublon
                const date = new Date();
                const produit = {
                    nom: req.body.nom,
                    description: req.body.description,
                    categorie_id: req.body.categorie_id,
                    prix: req.body.prix,
                    prix_achat: req.body.prix_achat,
                    taxation: req.body.taxation,
                    dateexpi: req.body.dateexpi,
                    code_barre: req.body.code_barre,
                    created_at: date,
                    updated_at: date
                };

                connection.query('INSERT INTO produit SET ?', produit, (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de l'ajout de produit :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de l'ajout de produit" });
                    }

                    const produitId = result.insertId;
                    connection.query('SELECT * FROM produit WHERE id = ?', [produitId], (err, rows) => {
                        if (err) {
                            console.error("Erreur lors de la récupération du produit :", err);
                            return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
                        }

                        return res.status(201).json(rows[0]);
                    });
                });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};




const listallProduit = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // 1️⃣ Récupérer tous les produits
            const queryProduits = `
                SELECT 
                    p.*, 
                    c.nom AS nom_categorie,
                    DATE_FORMAT(p.created_at, '%d/%m/%Y %H:%i:%s') AS date,
                    DATE_FORMAT(p.dateexpi, '%d/%m/%Y') AS date_expi
                FROM produit p
                LEFT JOIN categorie c ON p.categorie_id = c.id
                GROUP BY p.id, p.nom
            `;

            connection.query(queryProduits, (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des produits :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des produits" });
                }

                // 2️⃣ Récupérer tous les supplements liés aux produits
                const querySupplements = `SELECT 
                s.*, 
                u.nom AS unit
            FROM supplement s
            LEFT JOIN unit u ON s.unit = u.id`;

                connection.query(querySupplements, (err, supplements) => {
                    if (err) {
                        console.error("Erreur lors de la récupération des supplements :", err);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération des supplements" });
                    }

                    // 3️⃣ Ajouter les supplements correspondants à chaque produit
                    results.forEach(produit => {
                        produit.supplements = supplements.filter(supp => supp.produit_id === produit.id);
                    });

                    return res.status(200).json(results);
                });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


const listallProduitpagine = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Récupérer les paramètres depuis le body
            const { nombre = 10, page = 1 } = req.body;

            console.log("Valeur de nombre :", nombre);
            console.log("Valeur de page :", page);

            // Calcul de LIMIT et OFFSET
            const limit = parseInt(nombre, 10);
            const offset = (parseInt(page, 10) - 1) * limit;

            console.log("Valeur de LIMIT :", limit);
            console.log("Valeur de OFFSET :", offset);

            const query = `
                SELECT 
                    p.*, 
                    c.nom AS nom_categorie,
                    DATE_FORMAT(p.created_at, '%d/%m/%Y %H:%i:%s') AS date
                FROM 
                    produit p
                LEFT JOIN 
                    categorie c ON p.categorie_id = c.id
                ORDER BY 
                    p.created_at DESC
                LIMIT ? OFFSET ?
            `;

            connection.query(query, [limit, offset], (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des produits :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des produits" });
                } else {
                    console.log("Résultats retournés :", results.length);
                    return res.status(200).json(results);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

  




const updateProduit = async (req, res) => {
    try {
        const {id,nom,description,prix,prix_achat,taxation,dateexpi,categorie_id,code_barre,updated_at} = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const produit = {
            nom,
            description,
            prix,
            prix_achat,
            taxation,
            dateexpi,
            categorie_id,
            code_barre,
            updated_at: date,
        };
        
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE produit SET ? WHERE id = ? ';
            connection.query(updateQuery, [produit, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de produit :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de produit" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("produit mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


const detailProduitScan = async (req, res) => {
    try {
        const code_barre = req.body.code_barre;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM produit WHERE code_barre = ?', [code_barre], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération du code barre :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du code barre" });
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

const filtreBycodebarreorid = async (req, res) => {
    try {
        const { valeur } = req.body; // Une seule valeur envoyée

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Requête SQL pour chercher dans les deux colonnes
            const query = `
                SELECT * 
                FROM produit 
                WHERE code_barre LIKE ? 
                   OR nom LIKE ?
            `;
            const values = [`%${valeur}%`, `%${valeur}%`];

            connection.query(query, values, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des produits :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des produits" });
                }

                if (result.length === 0) {
                    return res.status(404).json({ message: "Aucun produit trouvé" });
                }

                return res.status(200).json(result);
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


// const detailProduit = async (req, res) => { 
//     try {
//         const id = req.body.id;

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             connection.query('SELECT * FROM produit WHERE id = ?', [id], (erreur, result) => {
//                 if (erreur) {
//                     console.error("Erreur lors de la récupération du produit :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
//                 } else {
//                     return res.status(200).json(result[0]);  // Renvoie le premier produit directement
//                 }
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };

// const detailProduit = async (req, res) => {
//     try {
//         const id = req.body.id;

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             // Requête avec jointures et comptage des ventes
//             const query = `
//                 SELECT 
//                     p.*, 
//                      DATE_FORMAT(p.created_at, '%d/%m/%Y %H:%i:%s'),
//                     s.quantite_stock AS stock_quantite, 
//                     s.created_at AS stock_created_at,
//                     COUNT(v.id) AS total_ventes  -- Comptage des ventes pour ce produit
//                 FROM 
//                     produit p
//                 LEFT JOIN 
//                     stock s ON p.id = s.produit_id
//                 LEFT JOIN 
//                     details_vente v ON p.id = v.produit_id
//                 WHERE 
//                     p.id = ?
//                 GROUP BY 
//                     p.id, s.quantite_stock, s.created_at`;

//             connection.query(query, [id], (erreur, result) => {
//                 if (erreur) {
//                     console.error("Erreur lors de la récupération des données :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de la récupération des données" });
//                 } else {
//                     if (result.length === 0) {
//                         return res.status(404).json({ erreur: "Produit non trouvé" });
//                     }
//                     return res.status(200).json(result[0]); // Renvoie les données combinées
//                 }
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };


const detailProduit = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // 1️⃣ Récupérer les détails du produit avec stock et nombre de ventes
            const queryProduit = `
                SELECT 
                    p.*, 
                    DATE_FORMAT(p.created_at, '%d/%m/%Y %H:%i:%s') AS created_at,
                    s.quantite_stock AS stock_quantite,
                    c.id AS iden_categorie,
                    c.nom AS nom_categorie,
                    s.created_at AS stock_created_at,
                    COUNT(v.id) AS total_ventes  
                FROM 
                    produit p
                LEFT JOIN 
                    stock s ON p.id = s.produit_id
                LEFT JOIN 
                    details_vente v ON p.id = v.produit_id
                    LEFT JOIN 
                    categorie c ON p.categorie_id = c.id
                WHERE 
                    p.id = ?
                GROUP BY 
                    p.id, s.quantite_stock, s.created_at`;

            connection.query(queryProduit, [id], (erreur, resultProduit) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération du produit :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
                }

                if (resultProduit.length === 0) {
                    return res.status(404).json({ erreur: "Produit non trouvé" });
                }

                const produit = resultProduit[0]; // Récupérer les infos du produit

                // 2️⃣ Récupérer tous les suppléments liés à ce produit
                const querySupplements = `SELECT 
                s.*, 
                u.nom AS unit,
                u.id AS unit_id
            FROM supplement s
            LEFT JOIN unit u ON s.unit = u.id
            WHERE s.produit_id = ?
            `;

                connection.query(querySupplements, [id], (erreur, resultSupplements) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération des suppléments :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération des suppléments" });
                    }

                    // 3️⃣ Construire et envoyer la réponse complète
                    return res.status(200).json({
                        produit,       // Infos du produit
                        supplements: resultSupplements, // Liste des suppléments liés au produit
                    });
                });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


const listUserProduit = async (req, res) => {
    try {
        const userid = req.body.user_id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM produit WHERE user_id = ?', [userid], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la recuperation des enregistrement de cet utilisteurs :", erreur);
                    return res.status(500).json({ erreur: "Erreur  lors de la recuperation  des enregistrement de cet utilisteurs" });
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

const deleteProduit = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM produit WHERE id = ?', [id], (erreur, result) => {
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
    ajouterProduit,
    listallProduit,
    detailProduit,
    deleteProduit,
    listUserProduit,
    updateProduit,
    detailProduitScan,
    filtreBycodebarreorid,
    listallProduitpagine
};