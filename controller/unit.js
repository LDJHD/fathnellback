// controller/Unit.js
const { connecter } = require("../bd/connect");

const ajouterUnit = async (req, res) => {
    const date=new Date();
    try {
        const Unit = {
            nom: req.body.nom,
            created_at:date,
            updated_at:date,
        }

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO unit SET ?', Unit, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de la catégorie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de la catégorie" });
                } else {
                    console.log("Catégorie ajoutée avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const listallUnit = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT id,nom ,DATE_FORMAT(created_at, "%d/%m/%Y %H:%i:%s") AS date_creation FROM unit', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des catégories :", erreur);
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

const detailUnit = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM unit WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la catégorie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la catégorie" });
                } else {
                    if (result.length === 0) {
                        return res.status(404).json({ erreur: "Unit non trouvé" });
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

const updateUnit = async (req, res) => {
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

            const updateQuery = `UPDATE unit SET ${setClause} WHERE id = ? `;
            connection.query(updateQuery, values, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de Unit :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de Unit" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID et cet utilisateur" });
                    }
                    console.log("Unit mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const deleteUnit = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM unit WHERE id = ?', [id], (erreur, result) => {
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

const countUserUnit = async (req, res) => {
    try {
       

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT COUNT(*) AS count FROM unit ', (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors du compte de catégorie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors du compte de catégorie :" });
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

const countUnit = async (req, res) => {
    try {
       

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT COUNT(*) AS count FROM unit ', (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors du compte de catégorie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors du compte de catégorie :" });
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
    ajouterUnit,
    listallUnit,
    detailUnit,
    deleteUnit,
    updateUnit,
    countUserUnit,
    countUnit
};
