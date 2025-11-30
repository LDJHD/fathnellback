const { connecter } = require("../bd/connect");

// Lister toutes les couleurs
const listallCouleurs = async (req, res) => {
    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `SELECT * FROM couleurs ORDER BY nom ASC`;

        connection.query(query, (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération des couleurs:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des couleurs" 
                });
            }

            res.status(200).json({
                message: "Couleurs récupérées avec succès",
                couleurs: results
            });
        });
    });
};

// Ajouter une couleur
const ajouterCouleur = async (req, res) => {
    const { nom, code_hex } = req.body;

    if (!nom || !code_hex) {
        return res.status(400).json({ 
            message: "Le nom et le code hexadécimal sont requis" 
        });
    }

    // Validation du format hexadécimal
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(code_hex)) {
        return res.status(400).json({ 
            message: "Format de couleur hexadécimale invalide (ex: #FF0000)" 
        });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `INSERT INTO couleurs (nom, code_hex) VALUES (?, ?)`;

        connection.query(query, [nom, code_hex], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ 
                        message: "Cette couleur existe déjà" 
                    });
                }
                console.error("Erreur lors de l'ajout de la couleur:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de l'ajout de la couleur" 
                });
            }

            res.status(201).json({
                message: "Couleur ajoutée avec succès",
                couleur: {
                    id: result.insertId,
                    nom,
                    code_hex
                }
            });
        });
    });
};

// Supprimer une couleur
const deleteCouleur = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `DELETE FROM couleurs WHERE id = ?`;

        connection.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(400).json({ 
                        message: "Impossible de supprimer cette couleur car elle est utilisée par des produits" 
                    });
                }
                console.error("Erreur lors de la suppression de la couleur:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la suppression de la couleur" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Couleur non trouvée" });
            }

            res.status(200).json({
                message: "Couleur supprimée avec succès"
            });
        });
    });
};

module.exports = {
    listallCouleurs,
    ajouterCouleur,
    deleteCouleur
};
