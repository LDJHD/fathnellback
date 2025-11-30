const { connecter } = require("../bd/connect");

// Lister toutes les catégories
const listallCategories = async (req, res) => {
    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                c.*,
                COUNT(p.id) as produits_count,
                parent.nom as parent_nom
            FROM categories c
            LEFT JOIN produits p ON c.id = p.categorie_id
            LEFT JOIN categories parent ON c.parent_id = parent.id
            GROUP BY c.id
            ORDER BY c.nom ASC
        `;

        connection.query(query, (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération des catégories:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des catégories",
                    error: err.message 
                });
            }

            res.status(200).json({
                message: "Catégories récupérées avec succès",
                categories: results
            });
        });
    });
};

// Ajouter une catégorie
const ajouterCategorie = async (req, res) => {
    const { nom, description, parent_id } = req.body;

    if (!nom) {
        return res.status(400).json({ message: "Le nom est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `INSERT INTO categories (nom, description, parent_id) VALUES (?, ?, ?)`;

        connection.query(query, [nom, description, parent_id], (err, result) => {
            if (err) {
                console.error("Erreur lors de l'ajout:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de l'ajout de la catégorie",
                    error: err.message 
                });
            }

            res.status(201).json({
                message: "Catégorie ajoutée avec succès",
                categorie: {
                    id: result.insertId,
                    nom,
                    description,
                    parent_id
                }
            });
        });
    });
};

// Détail d'une catégorie
const detailCategorie = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                c.*,
                COUNT(p.id) as produits_count,
                parent.nom as parent_nom
            FROM categories c
            LEFT JOIN produits p ON c.id = p.categorie_id
            LEFT JOIN categories parent ON c.parent_id = parent.id
            WHERE c.id = ?
            GROUP BY c.id
        `;

        connection.query(query, [id], (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération de la catégorie" 
                });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Catégorie non trouvée" });
            }

            // Récupérer les sous-catégories
            const childrenQuery = `SELECT * FROM categories WHERE parent_id = ?`;
            
            connection.query(childrenQuery, [id], (err, childrenResults) => {
                if (err) {
                    console.error("Erreur lors de la récupération des sous-catégories:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la récupération des sous-catégories" 
                    });
                }

                const categorie = {
                    ...results[0],
                    children: childrenResults
                };

                res.status(200).json({
                    message: "Catégorie récupérée avec succès",
                    categorie
                });
            });
        });
    });
};

// Modifier une catégorie
const updateCategorie = async (req, res) => {
    const { id, nom, description, parent_id } = req.body;

    if (!id || !nom) {
        return res.status(400).json({ message: "L'ID et le nom sont requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            UPDATE categories 
            SET nom = ?, description = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;

        connection.query(query, [nom, description, parent_id, id], (err, result) => {
            if (err) {
                console.error("Erreur lors de la modification:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la modification de la catégorie" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Catégorie non trouvée" });
            }

            res.status(200).json({
                message: "Catégorie modifiée avec succès"
            });
        });
    });
};

// Supprimer une catégorie
const deleteCategorie = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        // Vérifier s'il y a des produits dans cette catégorie
        const checkQuery = `SELECT COUNT(*) as count FROM produits WHERE categorie_id = ?`;
        
        connection.query(checkQuery, [id], (err, checkResults) => {
            if (err) {
                console.error("Erreur lors de la vérification:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la vérification" 
                });
            }

            if (checkResults[0].count > 0) {
                return res.status(400).json({ 
                    message: "Impossible de supprimer cette catégorie car elle contient des produits" 
                });
            }

            // Vérifier s'il y a des sous-catégories
            const checkChildrenQuery = `SELECT COUNT(*) as count FROM categories WHERE parent_id = ?`;
            
            connection.query(checkChildrenQuery, [id], (err, childrenResults) => {
                if (err) {
                    console.error("Erreur lors de la vérification des sous-catégories:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la vérification des sous-catégories" 
                    });
                }

                if (childrenResults[0].count > 0) {
                    return res.status(400).json({ 
                        message: "Impossible de supprimer cette catégorie car elle contient des sous-catégories" 
                    });
                }

                // Supprimer la catégorie
                const deleteQuery = `DELETE FROM categories WHERE id = ?`;

                connection.query(deleteQuery, [id], (err, result) => {
                    if (err) {
                        console.error("Erreur lors de la suppression:", err);
                        return res.status(500).json({ 
                            message: "Erreur lors de la suppression de la catégorie" 
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Catégorie non trouvée" });
                    }

                    res.status(200).json({
                        message: "Catégorie supprimée avec succès"
                    });
                });
            });
        });
    });
};

// Récupérer les catégories principales (sans parent)
const getCategoriesPrincipales = async (req, res) => {
    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                c.*,
                COUNT(p.id) as produits_count,
                (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as children_count
            FROM categories c
            LEFT JOIN produits p ON c.id = p.categorie_id
            WHERE c.parent_id IS NULL
            GROUP BY c.id
            ORDER BY c.nom ASC
        `;

        connection.query(query, (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des catégories principales" 
                });
            }

            res.status(200).json({
                message: "Catégories principales récupérées avec succès",
                categories: results
            });
        });
    });
};

// Récupérer les sous-catégories d'une catégorie
const getSousCategories = async (req, res) => {
    const { parent_id } = req.body;

    if (!parent_id) {
        return res.status(400).json({ message: "L'ID du parent est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                c.*,
                COUNT(p.id) as produits_count
            FROM categories c
            LEFT JOIN produits p ON c.id = p.categorie_id
            WHERE c.parent_id = ?
            GROUP BY c.id
            ORDER BY c.nom ASC
        `;

        connection.query(query, [parent_id], (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des sous-catégories" 
                });
            }

            res.status(200).json({
                message: "Sous-catégories récupérées avec succès",
                categories: results
            });
        });
    });
};

module.exports = {
    listallCategories,
    ajouterCategorie,
    detailCategorie,
    updateCategorie,
    deleteCategorie,
    getCategoriesPrincipales,
    getSousCategories
};
