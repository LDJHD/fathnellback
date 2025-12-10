const { connecter } = require("../bd/connect");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImagesToR2 } = require("../retourne");

// Configuration multer pour les images de collection
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/collections';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'collection-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Seules les images sont autorisées!'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');

// Créer une collection
const ajouterCollection = async (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ 
                message: "Erreur lors de l'upload de l'image",
                error: err.message 
            });
        }

        const { nom, description } = req.body;

        if (!nom) {
            return res.status(400).json({ message: "Le nom est requis" });
        }

        // --- 📌 UPLOAD vers Cloudflare R2 ---
        let image = null;
        if (req.file) {
            try {
                const urlsR2 = await uploadImagesToR2([req.file], "dev/collections");
                image = urlsR2[0];
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

            const query = `INSERT INTO collections (nom, description, image) VALUES (?, ?, ?)`;
            
            connection.query(query, [nom, description, image], (err, result) => {
                // Fermer la connexion après la requête
                connection.end();
                
                if (err) {
                    console.error("Erreur lors de l'insertion:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la création de la collection",
                        error: err.message 
                    });
                }

                res.status(201).json({
                    message: "Collection créée avec succès",
                    collection: {
                        id: result.insertId,
                        nom,
                        description,
                        image
                    }
                });
            });
        });
    });
};
// Lister toutes les collections
const listallCollections = async (req, res) => {
    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT c.*, COUNT(p.id) as nombre_articles 
            FROM collections c 
            LEFT JOIN produits p ON c.id = p.collection_id 
            GROUP BY c.id 
            ORDER BY c.created_at DESC
        `;

        connection.query(query, (err, results) => {
            // Fermer la connexion après la requête
            connection.end();
            
            if (err) {
                console.error("Erreur lors de la récupération:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des collections" 
                });
            }

            res.status(200).json({
                message: "Collections récupérées avec succès",
                collections: results
            });
        });
    });
};

// Détail d'une collection
const detailCollection = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `SELECT * FROM collections WHERE id = ?`;

        connection.query(query, [id], (err, results) => {
            // Fermer la connexion après la requête
            connection.end();
            
            if (err) {
                console.error("Erreur lors de la récupération:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération de la collection" 
                });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Collection non trouvée" });
            }

            res.status(200).json({
                message: "Collection récupérée avec succès",
                collection: results[0]
            });
        });
    });
};

// Supprimer une collection
const deleteCollection = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `DELETE FROM collections WHERE id = ?`;

        connection.query(query, [id], (err, result) => {
            // Fermer la connexion après la requête
            connection.end();
            
            if (err) {
                console.error("Erreur lors de la suppression:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la suppression de la collection" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Collection non trouvée" });
            }

            res.status(200).json({
                message: "Collection supprimée avec succès"
            });
        });
    });
};

// Modifier une collection
const updateCollection = async (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ 
                message: "Erreur lors de l'upload de l'image",
                error: err.message 
            });
        }

        const { id, nom, description } = req.body;

        if (!id || !nom) {
            return res.status(400).json({ message: "L'ID et le nom sont requis" });
        }

        // --- 📌 UPLOAD vers Cloudflare R2 ---
        let newImage = null;
        if (req.file) {
            try {
                const urlsR2 = await uploadImagesToR2([req.file], "dev/collections");
                newImage = urlsR2[0];
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

            let query, params;
            if (newImage) {
                query = `UPDATE collections SET nom = ?, description = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
                params = [nom, description, newImage, id];
            } else if (req.body.removeImage === 'true') {
                // Supprimer l'image si demandé
                query = `UPDATE collections SET nom = ?, description = ?, image = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
                params = [nom, description, id];
            } else {
                query = `UPDATE collections SET nom = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
                params = [nom, description, id];
            }

            connection.query(query, params, (err, result) => {
                // Fermer la connexion après la requête
                connection.end();
                
                if (err) {
                    console.error("Erreur lors de la modification:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la modification de la collection" 
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Collection non trouvée" });
                }

                res.status(200).json({
                    message: "Collection modifiée avec succès"
                });
            });
        });
    });
};

module.exports = {
    ajouterCollection,
    listallCollections,
    detailCollection,
    updateCollection,
    deleteCollection
};
