const { connecter } = require("../bd/connect");

// Lister toutes les tailles
const listallTailles = async (req, res) => {
    const { type } = req.query; // Optionnel: filtrer par type

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        let query = `SELECT * FROM tailles`;
        let queryParams = [];

        if (type && ['pointure', 'taille_vetement', 'dimension'].includes(type)) {
            query += ` WHERE type = ?`;
            queryParams.push(type);
        }

        query += ` ORDER BY 
            CASE type 
                WHEN 'pointure' THEN 1 
                WHEN 'taille_vetement' THEN 2 
                WHEN 'dimension' THEN 3 
            END, 
            CAST(nom AS UNSIGNED), nom ASC`;

        connection.query(query, queryParams, (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération des tailles:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des tailles" 
                });
            }

            // Grouper par type
            const taillesGroupees = {
                pointure: results.filter(t => t.type === 'pointure'),
                taille_vetement: results.filter(t => t.type === 'taille_vetement'),
                dimension: results.filter(t => t.type === 'dimension')
            };

            res.status(200).json({
                message: "Tailles récupérées avec succès",
                tailles: type ? results : taillesGroupees,
                tailles_toutes: results
            });
        });
    });
};

// Ajouter une taille
const ajouterTaille = async (req, res) => {
    const { nom, type = 'taille_vetement' } = req.body;

    if (!nom) {
        return res.status(400).json({ message: "Le nom est requis" });
    }

    if (!['pointure', 'taille_vetement', 'dimension'].includes(type)) {
        return res.status(400).json({ 
            message: "Type invalide. Valeurs autorisées : pointure, taille_vetement, dimension" 
        });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `INSERT INTO tailles (nom, type) VALUES (?, ?)`;

        connection.query(query, [nom, type], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ 
                        message: "Cette taille existe déjà pour ce type" 
                    });
                }
                console.error("Erreur lors de l'ajout de la taille:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de l'ajout de la taille" 
                });
            }

            res.status(201).json({
                message: "Taille ajoutée avec succès",
                taille: {
                    id: result.insertId,
                    nom,
                    type
                }
            });
        });
    });
};

// Supprimer une taille
const deleteTaille = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `DELETE FROM tailles WHERE id = ?`;

        connection.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(400).json({ 
                        message: "Impossible de supprimer cette taille car elle est utilisée par des produits" 
                    });
                }
                console.error("Erreur lors de la suppression de la taille:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la suppression de la taille" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Taille non trouvée" });
            }

            res.status(200).json({
                message: "Taille supprimée avec succès"
            });
        });
    });
};

module.exports = {
    listallTailles,
    ajouterTaille,
    deleteTaille
};
