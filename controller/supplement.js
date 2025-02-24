const { connecter } = require("../bd/connect");

const ajoutersupplement = async (req, res) => {
    try {
        const date = new Date();
        const supplements = req.body.supplements; // Récupérer le tableau des supplements
console.log(supplements)
        if (!Array.isArray(supplements) || supplements.length === 0) {
            return res.status(400).json({ erreur: "Aucun supplément fourni." });
        }

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur de connexion DB :", error);
                return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
            }

            const query = "INSERT INTO supplement (produit_id, prix, unit, created_at, updated_at) VALUES ?";
            const values = supplements.map(sup => [sup.produit_id, sup.prix, sup.unit, date, date]);

            connection.query(query, [values], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout des supplements :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout des supplements" });
                }
                res.status(201).json({ message: "Supplements ajoutés avec succès" });
            });
        });

    } catch (error) {
        console.error("Erreur serveur :", error);
        res.status(500).json({ erreur: "Erreur interne du serveur" });
    }
};



const listallsupplement = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM supplement', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des supplements :", erreur);
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


// const updatesupplement = async (req, res) => {
//     try {
//         const { id,
//             produit_id,
//             prix,
//             unit } = req.body;
//         const date = new Date;

//         if (!id) {
//             return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
//         }

//         const supplement = {
//             produit_id,
//             prix,
//             unit,
//             updated_at: date,
//         };
        
//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur lors de la connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
//             }

//             const updateQuery = 'UPDATE supplement SET ? WHERE id = ? ';
//             connection.query(updateQuery, [supplement, id], (erreur, result) => {
//                 if (erreur) {
//                     console.error("Erreur lors de la mise à jour de supplement :", erreur);
//                     return res.status(500).json({ erreur: "Erreur lors de la mise à jour de supplement" });
//                 } else {
//                     if (result.affectedRows === 0) {
//                         return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
//                     }
//                     console.log("supplement mis à jour avec succès.");
//                     return res.status(200).json({ message: "Mise à jour réussie", result });
//                 }
//             });
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };



// const updatesupplement = async (req, res) => {
//     try {
//         const { id, produit_id, prix, unit } = req.body;
//         const date = new Date();

//         if (!produit_id && !prix && !unit) {
//             return res.status(400).json({ erreur: "Les champs produit_id, prix et unit sont requis" });
//         }

//         const supplement = {
//             produit_id,
//             prix,
//             unit,
//             updated_at: date,
//         };

//         connecter((error, connection) => {
//             if (error) {
//                 console.error("Erreur de connexion à la base de données :", error);
//                 return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
//             }

//             if (id) {
//                 // Vérifier si l'ID existe déjà
//                 const checkQuery = "SELECT * FROM supplement WHERE id = ?";
//                 connection.query(checkQuery, [id], (err, rows) => {
//                     if (err) {
//                         console.error("Erreur lors de la vérification de l'ID :", err);
//                         return res.status(500).json({ erreur: "Erreur lors de la vérification de l'ID" });
//                     }

//                     if (rows.length > 0) {
//                         // L'ID existe, effectuer une mise à jour
//                         const updateQuery = "UPDATE supplement SET ? WHERE id = ?";
//                         connection.query(updateQuery, [supplement, id], (err, result) => {
//                             if (err) {
//                                 console.error("Erreur lors de la mise à jour :", err);
//                                 return res.status(500).json({ erreur: "Erreur lors de la mise à jour" });
//                             }
//                             return res.status(200).json({ message: "Mise à jour réussie", result });
//                         });
//                     } else {
//                         // L'ID n'existe pas, donc insérer un nouvel enregistrement
//                         const insertQuery = "INSERT INTO supplement SET ?";
//                         connection.query(insertQuery, [{ ...supplement, created_at: date }], (err, result) => {
//                             if (err) {
//                                 console.error("Erreur lors de l'insertion :", err);
//                                 return res.status(500).json({ erreur: "Erreur lors de l'insertion" });
//                             }
//                             return res.status(201).json({ message: "Création réussie", id: result.insertId });
//                         });
//                     }
//                 });
//             } else {
//                 // Pas d'ID fourni, on crée directement un nouvel enregistrement
//                 const insertQuery = "INSERT INTO supplement SET ?";
//                 connection.query(insertQuery, [{ ...supplement, created_at: date }], (err, result) => {
//                     if (err) {
//                         console.error("Erreur lors de l'insertion :", err);
//                         return res.status(500).json({ erreur: "Erreur lors de l'insertion" });
//                     }
//                     return res.status(201).json({ message: "Création réussie", id: result.insertId });
//                 });
//             }
//         });
//     } catch (error) {
//         console.error("Erreur serveur :", error);
//         return res.status(500).json({ erreur: "Erreur serveur" });
//     }
// };

const updatesupplement = async (req, res) => {
    try {
        const { id, produit_id, prix, unit ,unit_id} = req.body;
        const date = new Date();

        if (!produit_id || !prix || !unit) {
            return res.status(400).json({ erreur: "Les champs produit_id, prix et unit sont requis" });
        }

        // Vérification si une entrée pour ce produit_id et cette unité existe déjà
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur de connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur de connexion à la base de données" });
            }

            // Requête pour vérifier si le produit_id et unit existent déjà
            const checkQuery = "SELECT * FROM supplement WHERE produit_id = ? AND unit = ?";
            connection.query(checkQuery, [produit_id, unit], (err, rows) => {
                if (err) {
                    console.error("Erreur lors de la vérification de l'existence de la ligne :", err);
                    return res.status(500).json({ erreur: "Erreur lors de la vérification" });
                }

                if (rows.length > 0) {
                    // Une entrée avec le même produit_id et unit existe déjà
                    if (!id || rows[0].id !== id) {
                        return res.status(400).json({ erreur: "Une entrée avec ce produit_id et cette unité existe déjà" });
                    }
                }

                const supplement = {
                    produit_id,
                    prix,
                    unit,
                    updated_at: date,
                };

                if (id) {
                    // Vérifier si l'ID existe déjà
                    const checkIdQuery = "SELECT * FROM supplement WHERE id = ?";
                    connection.query(checkIdQuery, [id], (err, rows) => {
                        if (err) {
                            console.error("Erreur lors de la vérification de l'ID :", err);
                            return res.status(500).json({ erreur: "Erreur lors de la vérification de l'ID" });
                        }

                        if (rows.length > 0) {
                            // L'ID existe, effectuer une mise à jour
                            const updateQuery = "UPDATE supplement SET ? WHERE id = ?";
                            connection.query(updateQuery, [supplement, id], (err, result) => {
                                if (err) {
                                    console.error("Erreur lors de la mise à jour :", err);
                                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour" });
                                }
                                return res.status(200).json({ message: "Mise à jour réussie", result });
                            });
                        } else {
                            // L'ID n'existe pas, donc insérer un nouvel enregistrement
                            const insertQuery = "INSERT INTO supplement SET ?";
                            connection.query(insertQuery, [{ ...supplement, created_at: date }], (err, result) => {
                                if (err) {
                                    console.error("Erreur lors de l'insertion :", err);
                                    return res.status(500).json({ erreur: "Erreur lors de l'insertion" });
                                }
                                return res.status(201).json({ message: "Création réussie", id: result.insertId });
                            });
                        }
                    });
                } else {
                    // Pas d'ID fourni, on crée directement un nouvel enregistrement
                    const insertQuery = "INSERT INTO supplement SET ?";
                    connection.query(insertQuery, [{ ...supplement, created_at: date }], (err, result) => {
                        if (err) {
                            console.error("Erreur lors de l'insertion :", err);
                            return res.status(500).json({ erreur: "Erreur lors de l'insertion" });
                        }
                        return res.status(201).json({ message: "Création réussie", id: result.insertId });
                    });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


const detailsupplement = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM supplement WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération du supplement :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du supplement" });
                } else {
                    if (result.length === 0) {
                        return res.status(404).json({ erreur: "supplement non trouvé" });
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


const detailsupplementbyproduit = async (req, res) => { 
    try {
        const produit_id = req.body.produit_id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM supplement WHERE produit_id = ?', [produit_id], (erreur, result) => { 
                if (erreur) {
                    console.error("Erreur lors de la récupération du supplement :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du supplement" });
                } 

                if (result.length === 0) {
                    return res.status(404).json({ erreur: "Aucun supplement trouvé" });
                }

                return res.status(200).json(result); // Retourne tous les enregistrements
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


const deletesupplement = async (req, res) => {
    try {
        const id = req.body.id;
console.log(id);
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM supplement WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la suppression :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la suppression" });
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
    ajoutersupplement,
    listallsupplement,
    detailsupplement,
    deletesupplement,
    updatesupplement,
    detailsupplementbyproduit
 };
