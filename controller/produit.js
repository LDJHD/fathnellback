const { connecter } = require("../bd/connect");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration multer pour les images de produits
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/produits';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'produit-' + uniqueSuffix + path.extname(file.originalname));
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
}).array('images', 10); // Jusqu'à 10 images

// Ajouter un produit
const ajouterProduit = async (req, res) => {
    upload(req, res, function(err) {
        if (err) {
            return res.status(400).json({ 
                message: "Erreur lors de l'upload des images",
                error: err.message 
            });
        }

        const {
            nom,
            description,
            prix,
            prix_promo,
            en_promo = false,
            personnalisable = false,
            stock_status = 'disponible',
            code_barre,
            collection_id,
            categorie_id,
            couleurs = [],
            tailles = []
        } = req.body;

        // Conversion des booléens (FormData envoie des strings)
        const enPromoBoolean = en_promo === 'true' || en_promo === true;
        const personnalisableBoolean = personnalisable === 'true' || personnalisable === true;

        if (!nom || !prix || !categorie_id) {
            return res.status(400).json({ 
                message: "Le nom, le prix et la catégorie sont requis" 
            });
        }

        connecter((error, connection) => {
            if (error) {
                return res.status(500).json({ message: "Erreur de connexion à la base de données" });
            }

            // Commencer une transaction
            connection.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ 
                        message: "Erreur lors du démarrage de la transaction" 
                    });
                }

                // Insérer le produit
                const insertProduitQuery = `
                    INSERT INTO produits 
                    (nom, description, prix, prix_promo, en_promo, personnalisable, stock_status, code_barre, collection_id, categorie_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                connection.query(
                    insertProduitQuery,
                    [nom, description, prix, prix_promo, enPromoBoolean, personnalisableBoolean, stock_status, code_barre, collection_id, categorie_id],
                    (err, result) => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error("Erreur SQL:", err);
                                res.status(500).json({ 
                                    message: "Erreur lors de la création du produit",
                                    error: err.message 
                                });
                            });
                        }

                        const produit_id = result.insertId;
                        const promises = [];

                        // Ajouter les images
                        if (req.files && req.files.length > 0) {
                            req.files.forEach((file, index) => {
                                const insertImageQuery = `
                                    INSERT INTO produit_images (produit_id, image_url, is_principal, ordre) 
                                    VALUES (?, ?, ?, ?)
                                `;
                                
                                promises.push(new Promise((resolve, reject) => {
                                    connection.query(
                                        insertImageQuery,
                                        [produit_id, file.filename, index === 0, index + 1],
                                        (err, result) => {
                                            if (err) reject(err);
                                            else resolve(result);
                                        }
                                    );
                                }));
                            });
                        }

                        // Ajouter les couleurs
                        if (couleurs && couleurs.length > 0) {
                            const couleursArray = Array.isArray(couleurs) ? couleurs : JSON.parse(couleurs);
                            couleursArray.forEach(couleur_id => {
                                const insertCouleurQuery = `
                                    INSERT INTO produit_couleurs (produit_id, couleur_id) VALUES (?, ?)
                                `;
                                
                                promises.push(new Promise((resolve, reject) => {
                                    connection.query(
                                        insertCouleurQuery,
                                        [produit_id, couleur_id],
                                        (err, result) => {
                                            if (err) reject(err);
                                            else resolve(result);
                                        }
                                    );
                                }));
                            });
                        }

                        // Ajouter les tailles
                        if (tailles && tailles.length > 0) {
                            const taillesArray = Array.isArray(tailles) ? tailles : JSON.parse(tailles);
                            taillesArray.forEach(taille_id => {
                                const insertTailleQuery = `
                                    INSERT INTO produit_tailles (produit_id, taille_id) VALUES (?, ?)
                                `;
                                
                                promises.push(new Promise((resolve, reject) => {
                                    connection.query(
                                        insertTailleQuery,
                                        [produit_id, taille_id],
                                        (err, result) => {
                                            if (err) reject(err);
                                            else resolve(result);
                                        }
                                    );
                                }));
                            });
                        }

                        Promise.all(promises)
                            .then(() => {
                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            res.status(500).json({ 
                                                message: "Erreur lors de la validation du produit" 
                                            });
                                        });
                                    }

                                    res.status(201).json({
                                        message: "Produit créé avec succès",
                                        produit: {
                                            id: produit_id,
                                            nom,
                                            prix,
                                            images: req.files ? req.files.map(f => f.filename) : []
                                        }
                                    });
                                });
                            })
                            .catch((err) => {
                                connection.rollback(() => {
                                    console.error("Erreur lors de l'ajout des caractéristiques:", err);
                                    res.status(500).json({ 
                                        message: "Erreur lors de l'ajout des caractéristiques du produit" 
                                    });
                                });
                            });
                    }
                );
            });
        });
    });
};

// Lister tous les produits avec filtres
const listallProduit = async (req, res) => {
    const { 
        collection_id, 
        categorie_id, 
        personnalisable, 
        en_promo,
        prix_min,
        prix_max,
        search,
        limit = 50,
        offset = 0
    } = req.query;

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        let whereClause = "WHERE 1=1";
        let queryParams = [];

        if (collection_id) {
            whereClause += " AND p.collection_id = ?";
            queryParams.push(collection_id);
        }

        if (categorie_id) {
            whereClause += " AND p.categorie_id = ?";
            queryParams.push(categorie_id);
        }

        if (personnalisable !== undefined) {
            whereClause += " AND p.personnalisable = ?";
            queryParams.push(personnalisable === 'true');
        }

        if (en_promo !== undefined) {
            whereClause += " AND p.en_promo = ?";
            queryParams.push(en_promo === 'true');
        }

        if (prix_min) {
            whereClause += " AND p.prix >= ?";
            queryParams.push(prix_min);
        }

        if (prix_max) {
            whereClause += " AND p.prix <= ?";
            queryParams.push(prix_max);
        }

        if (search) {
            whereClause += " AND (p.nom LIKE ? OR p.description LIKE ?)";
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        const query = `
            SELECT 
                p.*,
                c.nom as collection_nom,
                cat.nom as categorie_nom,
                (SELECT image_url FROM produit_images WHERE produit_id = p.id AND is_principal = 1 LIMIT 1) as image_principale,
                (SELECT COUNT(*) FROM produit_images WHERE produit_id = p.id) as nombre_images
            FROM produits p
            LEFT JOIN collections c ON p.collection_id = c.id
            LEFT JOIN categories cat ON p.categorie_id = cat.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        connection.query(query, queryParams, (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération des produits:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des produits",
                    error: err.message 
                });
            }

            // Compter le total pour la pagination
            const countQuery = `SELECT COUNT(*) as total FROM produits p ${whereClause}`;
            
            connection.query(countQuery, queryParams.slice(0, -2), (err, countResults) => {
                if (err) {
                    console.error("Erreur lors du comptage:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors du comptage des produits" 
                    });
                }

                res.status(200).json({
                    message: "Produits récupérés avec succès",
                    produits: results,
                    pagination: {
                        total: countResults[0].total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        has_more: (parseInt(offset) + parseInt(limit)) < countResults[0].total
                    }
                });
            });
        });
    });
};

// Détail d'un produit complet
const detailProduit = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID du produit est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                p.*,
                c.nom as collection_nom,
                c.description as collection_description,
                cat.nom as categorie_nom,
                cat.description as categorie_description
            FROM produits p
            LEFT JOIN collections c ON p.collection_id = c.id
            LEFT JOIN categories cat ON p.categorie_id = cat.id
            WHERE p.id = ?
        `;

        connection.query(query, [id], (err, produitResults) => {
            if (err) {
                console.error("Erreur lors de la récupération du produit:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération du produit",
                    error: err.message 
                });
            }

            if (produitResults.length === 0) {
                return res.status(404).json({ message: "Produit non trouvé" });
            }

            const produit = produitResults[0];

            // Récupérer les images
            const imagesQuery = `SELECT * FROM produit_images WHERE produit_id = ? ORDER BY ordre ASC`;
            
            connection.query(imagesQuery, [id], (err, imagesResults) => {
                if (err) {
                    console.error("Erreur lors de la récupération des images:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la récupération des images" 
                    });
                }

                // Récupérer les couleurs
                const couleursQuery = `
                    SELECT c.* FROM couleurs c
                    JOIN produit_couleurs pc ON c.id = pc.couleur_id
                    WHERE pc.produit_id = ?
                    ORDER BY c.nom ASC
                `;

                connection.query(couleursQuery, [id], (err, couleursResults) => {
                    if (err) {
                        console.error("Erreur lors de la récupération des couleurs:", err);
                        return res.status(500).json({ 
                            message: "Erreur lors de la récupération des couleurs" 
                        });
                    }

                    // Récupérer les tailles
                    const taillesQuery = `
                        SELECT t.* FROM tailles t
                        JOIN produit_tailles pt ON t.id = pt.taille_id
                        WHERE pt.produit_id = ?
                        ORDER BY t.type, CAST(t.nom AS UNSIGNED), t.nom ASC
                    `;

                    connection.query(taillesQuery, [id], (err, taillesResults) => {
                        if (err) {
                            console.error("Erreur lors de la récupération des tailles:", err);
                            return res.status(500).json({ 
                                message: "Erreur lors de la récupération des tailles" 
                            });
                        }

                        // Assembler la réponse complète
                        const produitComplet = {
                            ...produit,
                            images: imagesResults,
                            couleurs: couleursResults,
                            tailles: taillesResults,
                            collection: produit.collection_nom ? {
                                nom: produit.collection_nom,
                                description: produit.collection_description
                            } : null,
                            categorie: {
                                nom: produit.categorie_nom,
                                description: produit.categorie_description
                            }
                        };

                        // Nettoyer les champs redondants
                        delete produitComplet.collection_nom;
                        delete produitComplet.collection_description;
                        delete produitComplet.categorie_nom;
                        delete produitComplet.categorie_description;

                        res.status(200).json({
                            message: "Produit récupéré avec succès",
                            produit: produitComplet
                        });
                    });
                });
            });
        });
    });
};

// Détail par code barre (fonction existante adaptée)
const detailProduitScan = async (req, res) => {
    const { code_barre } = req.body;

    if (!code_barre) {
        return res.status(400).json({ message: "Le code barre est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `SELECT * FROM produits WHERE code_barre = ?`;

        connection.query(query, [code_barre], (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération du produit" 
                });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Produit non trouvé" });
            }

            res.status(200).json({
                message: "Produit récupéré avec succès",
                produit: results[0]
            });
        });
    });
};

// Filtre par code barre ou ID (fonction existante adaptée)
const filtreBycodebarreorid = async (req, res) => {
    const { code_barre, id } = req.body;

    if (!code_barre && !id) {
        return res.status(400).json({ message: "Code barre ou ID requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        let query = `SELECT * FROM produits WHERE `;
        let params = [];

        if (id) {
            query += `id = ?`;
            params.push(id);
        } else {
            query += `code_barre = ?`;
            params.push(code_barre);
        }

        connection.query(query, params, (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération du produit" 
                });
            }

            res.status(200).json({
                message: "Produits récupérés avec succès",
                produits: results
            });
        });
    });
};

// Supprimer un produit
const deleteProduit = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `DELETE FROM produits WHERE id = ?`;

        connection.query(query, [id], (err, result) => {
            if (err) {
                console.error("Erreur lors de la suppression:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la suppression du produit" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Produit non trouvé" });
            }

            res.status(200).json({
                message: "Produit supprimé avec succès"
            });
        });
    });
};

// Liste paginée (fonction existante adaptée)
const listallProduitpagine = async (req, res) => {
    const { page = 1, limit = 10 } = req.body;
    const offset = (page - 1) * limit;

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                p.*,
                (SELECT image_url FROM produit_images WHERE produit_id = p.id AND is_principal = 1 LIMIT 1) as image_principale
            FROM produits p
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;

        connection.query(query, [parseInt(limit), parseInt(offset)], (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des produits" 
                });
            }

            // Compter le total
            const countQuery = `SELECT COUNT(*) as total FROM produits`;
            
            connection.query(countQuery, (err, countResults) => {
                if (err) {
                    console.error("Erreur lors du comptage:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors du comptage des produits" 
                    });
                }

                res.status(200).json({
                    message: "Produits récupérés avec succès",
                    produits: results,
                    pagination: {
                        current_page: parseInt(page),
                        total_pages: Math.ceil(countResults[0].total / limit),
                        total_items: countResults[0].total,
                        items_per_page: parseInt(limit)
                    }
                });
            });
        });
    });
};

// Mettre à jour un produit
const updateProduit = async (req, res) => {
    upload(req, res, function(err) {
        if (err) {
            return res.status(400).json({ 
                message: "Erreur lors de l'upload des images",
                error: err.message 
            });
        }

        const {
            id,
            nom,
            description,
            prix,
            prix_promo,
            en_promo = false,
            personnalisable = false,
            stock_status = 'disponible',
            code_barre,
            collection_id,
            categorie_id,
            couleurs = [],
            tailles = []
        } = req.body;

        // Conversion des booléens (FormData envoie des strings)
        const enPromoBoolean = en_promo === 'true' || en_promo === true;
        const personnalisableBoolean = personnalisable === 'true' || personnalisable === true;

        if (!id) {
            return res.status(400).json({ 
                message: "L'ID du produit est requis" 
            });
        }

        if (!nom || !prix || !categorie_id) {
            return res.status(400).json({ 
                message: "Le nom, le prix et la catégorie sont requis" 
            });
        }

        connecter((error, connection) => {
            if (error) {
                return res.status(500).json({ message: "Erreur de connexion à la base de données" });
            }

            // Commencer une transaction
            connection.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ 
                        message: "Erreur lors du démarrage de la transaction" 
                    });
                }

                // Mettre à jour le produit
                const updateProduitQuery = `
                    UPDATE produits 
                    SET nom = ?, description = ?, prix = ?, prix_promo = ?, en_promo = ?, 
                        personnalisable = ?, stock_status = ?, code_barre = ?, collection_id = ?, categorie_id = ?, updated_at = NOW()
                    WHERE id = ?
                `;

                connection.query(
                    updateProduitQuery,
                    [nom, description, prix, prix_promo, enPromoBoolean, personnalisableBoolean, stock_status, code_barre, collection_id, categorie_id, id],
                    (err, result) => {
                        if (err) {
                            return connection.rollback(() => {
                                console.error("Erreur SQL:", err);
                                res.status(500).json({ 
                                    message: "Erreur lors de la mise à jour du produit",
                                    error: err.message 
                                });
                            });
                        }

                        if (result.affectedRows === 0) {
                            return connection.rollback(() => {
                                res.status(404).json({ message: "Produit non trouvé" });
                            });
                        }

                        const promises = [];

                        // Ajouter nouvelles images si fournies
                        if (req.files && req.files.length > 0) {
                            // Récupérer le nombre d'images existantes pour l'ordre
                            const getImageCountQuery = `SELECT COUNT(*) as count FROM produit_images WHERE produit_id = ?`;
                            
                            promises.push(new Promise((resolve, reject) => {
                                connection.query(getImageCountQuery, [id], (err, countResult) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    
                                    const startOrder = countResult[0].count;
                                    const imagePromises = [];
                                    
                                    req.files.forEach((file, index) => {
                                        const insertImageQuery = `
                                            INSERT INTO produit_images (produit_id, image_url, is_principal, ordre) 
                                            VALUES (?, ?, ?, ?)
                                        `;
                                        
                                        imagePromises.push(new Promise((resolveImage, rejectImage) => {
                                            connection.query(
                                                insertImageQuery,
                                                [id, file.filename, startOrder === 0 && index === 0, startOrder + index + 1],
                                                (err, result) => {
                                                    if (err) rejectImage(err);
                                                    else resolveImage(result);
                                                }
                                            );
                                        }));
                                    });
                                    
                                    Promise.all(imagePromises).then(resolve).catch(reject);
                                });
                            }));
                        }

                        // Mettre à jour les couleurs
                        if (couleurs && couleurs.length >= 0) {
                            // Supprimer les anciennes couleurs
                            promises.push(new Promise((resolve, reject) => {
                                const deleteCouleurQuery = `DELETE FROM produit_couleurs WHERE produit_id = ?`;
                                connection.query(deleteCouleurQuery, [id], (err, result) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }

                                    // Ajouter les nouvelles couleurs
                                    if (couleurs.length > 0) {
                                        const couleursArray = Array.isArray(couleurs) ? couleurs : JSON.parse(couleurs);
                                        const couleurPromises = [];
                                        
                                        couleursArray.forEach(couleur_id => {
                                            const insertCouleurQuery = `
                                                INSERT INTO produit_couleurs (produit_id, couleur_id) VALUES (?, ?)
                                            `;
                                            
                                            couleurPromises.push(new Promise((resolveCouleur, rejectCouleur) => {
                                                connection.query(
                                                    insertCouleurQuery,
                                                    [id, couleur_id],
                                                    (err, result) => {
                                                        if (err) rejectCouleur(err);
                                                        else resolveCouleur(result);
                                                    }
                                                );
                                            }));
                                        });
                                        
                                        Promise.all(couleurPromises).then(resolve).catch(reject);
                                    } else {
                                        resolve();
                                    }
                                });
                            }));
                        }

                        // Mettre à jour les tailles
                        if (tailles && tailles.length >= 0) {
                            // Supprimer les anciennes tailles
                            promises.push(new Promise((resolve, reject) => {
                                const deleteTailleQuery = `DELETE FROM produit_tailles WHERE produit_id = ?`;
                                connection.query(deleteTailleQuery, [id], (err, result) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }

                                    // Ajouter les nouvelles tailles
                                    if (tailles.length > 0) {
                                        const taillesArray = Array.isArray(tailles) ? tailles : JSON.parse(tailles);
                                        const taillePromises = [];
                                        
                                        taillesArray.forEach(taille_id => {
                                            const insertTailleQuery = `
                                                INSERT INTO produit_tailles (produit_id, taille_id) VALUES (?, ?)
                                            `;
                                            
                                            taillePromises.push(new Promise((resolveTaille, rejectTaille) => {
                                                connection.query(
                                                    insertTailleQuery,
                                                    [id, taille_id],
                                                    (err, result) => {
                                                        if (err) rejectTaille(err);
                                                        else resolveTaille(result);
                                                    }
                                                );
                                            }));
                                        });
                                        
                                        Promise.all(taillePromises).then(resolve).catch(reject);
                                    } else {
                                        resolve();
                                    }
                                });
                            }));
                        }

                        Promise.all(promises)
                            .then(() => {
                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            res.status(500).json({ 
                                                message: "Erreur lors de la validation de la mise à jour" 
                                            });
                                        });
                                    }

                                    res.status(200).json({
                                        message: "Produit mis à jour avec succès",
                                        produit: {
                                            id,
                                            nom,
                                            prix,
                                            images: req.files ? req.files.map(f => f.filename) : []
                                        }
                                    });
                                });
                            })
                            .catch((err) => {
                                connection.rollback(() => {
                                    console.error("Erreur lors de la mise à jour des caractéristiques:", err);
                                    res.status(500).json({ 
                                        message: "Erreur lors de la mise à jour des caractéristiques du produit" 
                                    });
                                });
                            });
                    }
                );
            });
        });
    });
};

module.exports = {
    ajouterProduit,
    listallProduit,
    detailProduit,
    detailProduitScan,
    filtreBycodebarreorid,
    deleteProduit,
    updateProduit,
    listallProduitpagine
};
