const { connecter } = require("../bd/connect");

const ajouterCompany = async (req, res) => {
    const date = new Date();
    try {
        const company = {
            name: req.body.name,
            created_at: date,
            updated_at: date,
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO company SET ?', company, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de la compagnie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de la compagnie" });
                } else {
                    console.log("Compagnie ajoutée avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const listallCompany = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT id, name, DATE_FORMAT(created_at, "%d/%m/%Y %H:%i:%s") AS date_creation FROM company', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des compagnies :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des compagnies" });
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

const detailCompany = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM company WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la compagnie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la compagnie" });
                } else {
                    if (result.length === 0) {
                        return res.status(404).json({ erreur: "Compagnie non trouvée" });
                    }
                    return res.status(200).json(result[0]);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const updateCompany = async (req, res) => {
    try {
        const date = new Date();
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const fieldsToUpdate = ['id', 'name'];
        const updates = {};
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        updates.updated_at = date;
        const setClause = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = `UPDATE company SET ${setClause} WHERE id = ?`;
            connection.query(updateQuery, values, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de la compagnie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de la compagnie" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("Compagnie mise à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const deleteCompany = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM company WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la suppression de la compagnie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la suppression de la compagnie" });
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

const countCompany = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT COUNT(*) AS count FROM company', (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors du compte de compagnie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors du compte de compagnie :" });
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
    ajouterCompany,
    listallCompany,
    detailCompany,
    updateCompany,
    deleteCompany,
    countCompany
}; 