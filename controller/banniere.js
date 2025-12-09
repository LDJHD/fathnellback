const { connecter } = require("../bd/connect");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImagesToR2 } = require("../retourne");

// Configuration multer spécifique pour les bannières
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/bannieres';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banniere-' + uniqueSuffix + path.extname(file.originalname));
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
        cb(new Error('Erreur: Seuls les fichiers image sont autorisés - ' + filetypes));
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
}).single('image');

// Ajouter une bannière
const ajouterBanniere = (req, res) => {
    uploadBanniere(req, res, async function (err) {
        if (err) {
            console.error('Erreur upload:', err);
            return res.status(400).json({ 
                success: false, 
                message: err.message 
            });
        }

        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Aucune image fournie' 
            });
        }

        const { titre, description, ordre } = req.body;
        
        // --- 📌 UPLOAD vers Cloudflare R2 ---
        let urlsR2 = [];
        try {
            urlsR2 = await uploadImagesToR2([req.file], "dev/bannieres");
        } catch (error) {
            console.error("Erreur upload R2:", error);
            return res.status(500).json({ 
                success: false,
                message: "Erreur lors de l'envoi des fichiers vers Cloudflare R2",
                error: error.message 
            });
        }

        const image_url = urlsR2[0];

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion BDD:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erreur de connexion à la base de données' 
                });
            }

            const query = `
                INSERT INTO bannieres (titre, description, image_url, ordre, actif) 
                VALUES (?, ?, ?, ?, TRUE)
            `;
            
            const values = [
                titre || null,
                description || null,
                image_url,
                ordre || 1
            ];

            connection.query(query, values, (error, results) => {
                connection.end();
                
                if (error) {
                    console.error('Erreur lors de l\'ajout de la bannière:', error);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Erreur lors de l\'ajout de la bannière' 
                    });
                }

                res.json({ 
                    success: true, 
                    message: 'Bannière ajoutée avec succès',
                    banniere_id: results.insertId,
                    image_url: image_url
                });
            });
        });
    });
};

// Lister toutes les bannières (pour l'admin)
const listAllBannieres = (req, res) => {
    connecter((error, connection) => {
        if (error) {
            console.error('Erreur de connexion BDD:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur de connexion à la base de données' 
            });
        }

        const query = `SELECT * FROM bannieres ORDER BY ordre ASC, created_at DESC`;

        connection.query(query, (error, results) => {
            connection.end();
            
            if (error) {
                console.error('Erreur lors de la récupération des bannières:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erreur lors de la récupération des bannières' 
                });
            }

            res.json({ 
                success: true, 
                bannieres: results 
            });
        });
    });
};

// Lister les bannières actives (pour le site public)
const listBannieresActives = (req, res) => {
    connecter((error, connection) => {
        if (error) {
            console.error('Erreur de connexion BDD:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur de connexion à la base de données' 
            });
        }

        const query = `SELECT * FROM bannieres WHERE actif = TRUE ORDER BY ordre ASC, created_at DESC`;

        connection.query(query, (error, results) => {
            connection.end();
            
            if (error) {
                console.error('Erreur lors de la récupération des bannières actives:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erreur lors de la récupération des bannières actives' 
                });
            }

            res.json({ 
                success: true, 
                bannieres: results 
            });
        });
    });
};

// Supprimer une bannière
const supprimerBanniere = (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID de la bannière requis' 
        });
    }

    connecter((error, connection) => {
        if (error) {
            console.error('Erreur de connexion BDD:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur de connexion à la base de données' 
            });
        }

        const query = `DELETE FROM bannieres WHERE id = ?`;

        connection.query(query, [id], (error, results) => {
            connection.end();
            
            if (error) {
                console.error('Erreur lors de la suppression de la bannière:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erreur lors de la suppression de la bannière' 
                });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Bannière non trouvée' 
                });
            }

            res.json({ 
                success: true, 
                message: 'Bannière supprimée avec succès' 
            });
        });
    });
};

// Mettre à jour l'état d'une bannière (actif/inactif)
const toggleBanniere = (req, res) => {
    const { id, actif } = req.body;

    if (!id || actif === undefined) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID et état de la bannière requis' 
        });
    }

    connecter((error, connection) => {
        if (error) {
            console.error('Erreur de connexion BDD:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Erreur de connexion à la base de données' 
            });
        }

        const query = `UPDATE bannieres SET actif = ? WHERE id = ?`;

        connection.query(query, [actif, id], (error, results) => {
            connection.end();
            
            if (error) {
                console.error('Erreur lors de la mise à jour de la bannière:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erreur lors de la mise à jour de la bannière' 
                });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Bannière non trouvée' 
                });
            }

            res.json({ 
                success: true, 
                message: `Bannière ${actif ? 'activée' : 'désactivée'} avec succès` 
            });
        });
    });
};

module.exports = {
    ajouterBanniere,
    listAllBannieres,
    listBannieresActives,
    supprimerBanniere,
    toggleBanniere
};