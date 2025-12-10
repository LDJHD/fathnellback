const { connecter } = require("../bd/connect");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImagesToR2 } = require("../retourne");

// Configuration multer pour les bannières de catégories
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/categories';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banniere-cat-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadBanniere = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Erreur: Seuls les fichiers image sont autorisés'));
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
}).single('banniere');

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
    uploadBanniere(req, res, async function (err) {
        if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') {
            console.error('Erreur upload:', err);
            return res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }

        const { nom, description, parent_id } = req.body;

        if (!nom) {
            return res.status(400).json({ message: "Le nom est requis" });
        }

        // --- 📌 UPLOAD vers Cloudflare R2 ---
        let banniere_url = null;
        if (req.file) {
            try {
                const urlsR2 = await uploadImagesToR2([req.file], "dev/categories");
                banniere_url = urlsR2[0];
            } catch (error) {
                console.error("Erreur upload R2:", error);
                return res.status(500).json({ 
                    message: "Erreur lors de l'envoi des fichiers vers Cloudflare R2",
                    error: error.message 
                });
            }
        }

        connecter((error, connection) => {
            if (error) {
                return res.status(500).json({ message: "Erreur de connexion à la base de données" });
            }

            // Vérifier si la colonne banniere_url existe
            const checkColumnQuery = `SHOW COLUMNS FROM categories LIKE 'banniere_url'`;
            
            connection.query(checkColumnQuery, (checkErr, checkResults) => {
                if (checkErr) {
                    console.error("Erreur lors de la vérification de colonne:", checkErr);
                    connection.end();
                    return res.status(500).json({ 
                        message: "Erreur lors de la vérification de la structure de table" 
                    });
                }

                let query, values;
                
                if (checkResults.length > 0) {
                    // La colonne banniere_url existe
                    query = `INSERT INTO categories (nom, description, parent_id, banniere_url) VALUES (?, ?, ?, ?)`;
                    values = [nom, description, parent_id, banniere_url];
                } else {
                    // La colonne banniere_url n'existe pas encore
                    console.warn("ATTENTION: La colonne banniere_url n'existe pas. Exécutez le script SQL d'update.");
                    query = `INSERT INTO categories (nom, description, parent_id) VALUES (?, ?, ?)`;
                    values = [nom, description, parent_id];
                }

                connection.query(query, values, (err, result) => {
                    connection.end();
                    
                    if (err) {
                        console.error("Erreur lors de l'ajout:", err);
                        return res.status(500).json({ 
                            message: "Erreur lors de l'ajout de la catégorie",
                            error: err.message,
                            sql_update_needed: checkResults.length === 0
                        });
                    }

                    res.status(201).json({
                        message: "Catégorie ajoutée avec succès",
                        categorie: {
                            id: result.insertId,
                            nom,
                            description,
                            parent_id,
                            banniere_url: checkResults.length > 0 ? banniere_url : null
                        },
                        sql_update_needed: checkResults.length === 0
                    });
                });
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
    uploadBanniere(req, res, async function (err) {
        if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') {
            console.error('Erreur upload:', err);
            return res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }

        const { id, nom, description, parent_id } = req.body;

        if (!id || !nom) {
            return res.status(400).json({ message: "L'ID et le nom sont requis" });
        }

        // --- 📌 UPLOAD vers Cloudflare R2 ---
        let banniere_url = null;
        if (req.file) {
            try {
                const urlsR2 = await uploadImagesToR2([req.file], "dev/categories");
                banniere_url = urlsR2[0];
            } catch (error) {
                console.error("Erreur upload R2:", error);
                return res.status(500).json({ 
                    message: "Erreur lors de l'envoi des fichiers vers Cloudflare R2",
                    error: error.message 
                });
            }
        }

        connecter((error, connection) => {
            if (error) {
                return res.status(500).json({ message: "Erreur de connexion à la base de données" });
            }

            // Si une nouvelle bannière est uploadée, l'inclure dans la mise à jour
            let query, values;
            if (req.file) {
                query = `
                    UPDATE categories 
                    SET nom = ?, description = ?, parent_id = ?, banniere_url = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `;
                values = [nom, description, parent_id, banniere_url, id];
            } else if (req.body.removeBanniere === 'true') {
                // Supprimer la bannière si demandé
                query = `
                    UPDATE categories 
                    SET nom = ?, description = ?, parent_id = ?, banniere_url = NULL, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `;
                values = [nom, description, parent_id, id];
            } else {
                query = `
                    UPDATE categories 
                    SET nom = ?, description = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `;
                values = [nom, description, parent_id, id];
            }

            connection.query(query, values, (err, result) => {
                connection.end();
                
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
                    message: "Catégorie modifiée avec succès",
                    banniere_url: req.file ? banniere_url : undefined
                });
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
