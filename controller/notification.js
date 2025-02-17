// controller/Notification.js
const { connecter } = require("../bd/connect");

const ajouterNotification = async (req, res) => {
    const date=new Date();
    try {
        const Notification = {
            nom: req.body.nom,
            created_at:date,
            updated_at:date,
        }

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO notification SET ?', Notification, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de la notification :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de la notification" });
                } else {
                    console.log("notification ajoutée avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const listallNotification = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Récupération des notifications et du nombre total
            connection.query(
                `SELECT id, message, lu, DATE_FORMAT(created_at, "%d/%m/%Y %H:%i:%s") AS date_creation FROM notification`, 
                (erreur, results) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération des notifications :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération des notifications" });
                    }

                    // Récupération des statistiques (nombre total, lu et non lu)
                    connection.query(
                        `SELECT 
                            COUNT(*) AS nombreTotal, 
                            SUM(lu = 1) AS nombreLu, 
                            SUM(lu = 0) AS nombreNonLu 
                        FROM notification`, 
                        (err, stats) => {
                            if (err) {
                                console.error("Erreur lors du comptage des notifications :", err);
                                return res.status(500).json({ erreur: "Erreur lors du comptage des notifications" });
                            }

                            // Renvoie la réponse avec les notifications et les statistiques
                            return res.status(200).json({
                                notifications: results,
                                nombreTotal: stats[0].nombreTotal || 0,
                                nombreLu: stats[0].nombreLu || 0,
                                nombreNonLu: stats[0].nombreNonLu || 0
                            });
                        }
                    );
                }
            );
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


const detailNotification = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM notification WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la notification :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la notification" });
                } else {
                    if (result.length === 0) {
                        return res.status(404).json({ erreur: "Notification non trouvé" });
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

const contLuNotification = async (req, res) => {
    try {
        const lu = req.body.lu;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT COUNT(*) AS countlu FROM Notification WHERE lu = ?', [lu], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la notification :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la notification" });
                } else {
                    if (result.length === 0) {
                        return res.status(404).json({ erreur: "Notification non trouvé" });
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


const contNonLuNotification = async (req, res) => {
    try {
       const lu=0;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT COUNT(*) AS countnonlu FROM Notification WHERE lu = ?', [lu], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la notification :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la notification" });
                } else {
                    if (result.length === 0) {
                        return res.status(404).json({ erreur: "Notification non trouvé" });
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

const updateNotification = async (req, res) => {
    try {
        const date = new Date();
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        // Liste des champs autorisés à être mis à jour
        const fieldsToUpdate = ['id','nom'];

        

        // Filtrer les champs présents dans req.body
        const updates = {};
           fieldsToUpdate.forEach(field => {
               if (req.body[field] !== undefined) {
                   updates[field] = req.body[field];
               }
           });


        //Mettre a jour la colonne udated_at
        updates.updated_at=date;

       
        // Construire dynamiquement la requête SQL
        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);
      

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = `UPDATE notification SET ${setClause} WHERE id = ? `;
            connection.query(updateQuery, values, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de Notification :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de Notification" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID et cet utilisateur" });
                    }
                    console.log("Notification mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM notification WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la notification :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la notification" });
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


const countNotification = async (req, res) => {
    try {
       

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT COUNT(*) AS count FROM notification ', (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors du compte de notification :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors du compte de notification :" });
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
    ajouterNotification,
    listallNotification,
    detailNotification,
    deleteNotification,
    updateNotification,
    contNonLuNotification,
    countNotification
};
