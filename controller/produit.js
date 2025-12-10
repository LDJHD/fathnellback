const { connecter } = require("../bd/connect");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImagesToR2 } = require("../retourne");


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
        // uploadImagesToR2([file])
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accepter images et vidéos
        const allowedMimes = /\.(jpg|jpeg|png|gif|mp4|webm|mov|avi)$/i;
        if (!file.originalname.match(allowedMimes)) {
            return cb(new Error('Seules les images (jpg, jpeg, png, gif) et vidéos (mp4, webm, mov, avi) sont autorisées!'), false);
        }
        cb(null, true);
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB pour supporter les vidéos
}).array('medias', 15); // Jusqu'à 15 médias (images + vidéos)

// // Ajouter un produit
// const ajouterProduit = async (req, res) => {
//     upload(req, res, function(err) {
//         if (err) {
//             return res.status(400).json({ 
//                 message: "Erreur lors de l'upload des images",
//                 error: err.message 
//             });
//         }

//         const {
//             nom,
//             description,
//             prix,
//             prix_promo,
//             en_promo = false,
//             vedette = false,
//             personnalisable = false,
//             stock_status = 'disponible',
//             code_barre,
//             collection_id,
//             categorie_id,
//             couleurs = [],
//             tailles = []
//         } = req.body;

//         // Conversion des booléens (FormData envoie des strings)
//         const enPromoBoolean = en_promo === 'true' || en_promo === true;
//         const vedetteBoolean = vedette === 'true' || vedette === true;
//         const personnalisableBoolean = personnalisable === 'true' || personnalisable === true;

//         if (!nom || !prix || !categorie_id) {
//             return res.status(400).json({ 
//                 message: "Le nom, le prix et la catégorie sont requis" 
//             });
//         }

//         connecter((error, connection) => {
//             if (error) {
//                 return res.status(500).json({ message: "Erreur de connexion à la base de données" });
//             }

//             // Commencer une transaction
//             connection.beginTransaction((err) => {
//                 if (err) {
//                     return res.status(500).json({ 
//                         message: "Erreur lors du démarrage de la transaction" 
//                     });
//                 }

//                 // Insérer le produit
//                 const insertProduitQuery = `
//                     INSERT INTO produits 
//                     (nom, description, prix, prix_promo, en_promo, vedette, personnalisable, stock_status, code_barre, collection_id, categorie_id) 
//                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//                 `;

//                 connection.query(
//                     insertProduitQuery,
//                     [nom, description, prix, prix_promo, enPromoBoolean, vedetteBoolean, personnalisableBoolean, stock_status, code_barre, collection_id, categorie_id],
//                     (err, result) => {
//                         if (err) {
//                             return connection.rollback(() => {
//                                 console.error("Erreur SQL:", err);
//                                 res.status(500).json({ 
//                                     message: "Erreur lors de la création du produit",
//                                     error: err.message 
//                                 });
//                             });
//                         }

//                         const produit_id = result.insertId;
//                         const promises = [];

//                         // Ajouter les médias (images et vidéos)
//                         if (req.files && req.files.length > 0) {
//                             req.files.forEach((file, index) => {
//                                 // Déterminer le type de média
//                                 const isVideo = /\.(mp4|webm|mov|avi)$/i.test(file.originalname);
//                                 const typeMedia = isVideo ? 'video' : 'image';
                                
//                                 const insertMediaQuery = `
//                                     INSERT INTO produit_medias (produit_id, media_url, type_media, is_principal, ordre) 
//                                     VALUES (?, ?, ?, ?, ?)
//                                 `;
                                
//                                 promises.push(new Promise((resolve, reject) => {
//                                     connection.query(
//                                         insertMediaQuery,
//                                         [produit_id, file.filename, typeMedia, index === 0, index + 1],
//                                         (err, result) => {
//                                             if (err) reject(err);
//                                             else resolve(result);
//                                         }
//                                     );
//                                 }));
//                             });
//                         }

//                         // Ajouter les couleurs
//                         if (couleurs && couleurs.length > 0) {
//                             const couleursArray = Array.isArray(couleurs) ? couleurs : JSON.parse(couleurs);
//                             couleursArray.forEach(couleur_id => {
//                                 const insertCouleurQuery = `
//                                     INSERT INTO produit_couleurs (produit_id, couleur_id) VALUES (?, ?)
//                                 `;
                                
//                                 promises.push(new Promise((resolve, reject) => {
//                                     connection.query(
//                                         insertCouleurQuery,
//                                         [produit_id, couleur_id],
//                                         (err, result) => {
//                                             if (err) reject(err);
//                                             else resolve(result);
//                                         }
//                                     );
//                                 }));
//                             });
//                         }

//                         // Ajouter les tailles
//                         if (tailles && tailles.length > 0) {
//                             const taillesArray = Array.isArray(tailles) ? tailles : JSON.parse(tailles);
//                             taillesArray.forEach(taille_id => {
//                                 const insertTailleQuery = `
//                                     INSERT INTO produit_tailles (produit_id, taille_id) VALUES (?, ?)
//                                 `;
                                
//                                 promises.push(new Promise((resolve, reject) => {
//                                     connection.query(
//                                         insertTailleQuery,
//                                         [produit_id, taille_id],
//                                         (err, result) => {
//                                             if (err) reject(err);
//                                             else resolve(result);
//                                         }
//                                     );
//                                 }));
//                             });
//                         }

//                         Promise.all(promises)
//                             .then(() => {
//                                 connection.commit((err) => {
//                                     if (err) {
//                                         return connection.rollback(() => {
//                                             res.status(500).json({ 
//                                                 message: "Erreur lors de la validation du produit" 
//                                             });
//                                         });
//                                     }

//                                     res.status(201).json({
//                                         message: "Produit créé avec succès",
//                                         produit: {
//                                             id: produit_id,
//                                             nom,
//                                             prix,
//                                             images: req.files ? req.files.map(f => f.filename) : []
//                                         }
//                                     });
//                                 });
//                             })
//                             .catch((err) => {
//                                 connection.rollback(() => {
//                                     console.error("Erreur lors de l'ajout des caractéristiques:", err);
//                                     res.status(500).json({ 
//                                         message: "Erreur lors de l'ajout des caractéristiques du produit" 
//                                     });
//                                 });
//                             });
//                     }
//                 );
//             });
//         });
//     });
// };


// Ajouter un produit
const ajouterProduit = async (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ 
                message: "Erreur lors de l'upload des médias",
                error: err.message 
            });
        }

        const {
            nom,
            description,
            prix,
            prix_promo,
            en_promo = false,
            vedette = false,
            personnalisable = false,
            stock_status = 'disponible',
            code_barre,
            collection_id,
            categorie_id,
            couleurs = [],
            tailles = []
        } = req.body;

        if (!nom || !prix || !categorie_id) {
            return res.status(400).json({ message: "Le nom, le prix et la catégorie sont requis" });
        }

        // Convertir les booléens
        const enPromoBoolean = (en_promo === "true" || en_promo === true);
        const vedetteBoolean = (vedette === "true" || vedette === true);
        const personnalisableBoolean = (personnalisable === "true" || personnalisable === true);

        // --- 📌 UPLOAD vers Cloudflare R2 ---
        let urlsR2 = [];

        try {
            urlsR2 = await uploadImagesToR2(req.files, "dev/produits");
        } catch (error) {
            console.error("Erreur upload R2:", error);
            return res.status(500).json({ 
                message: "Erreur lors de l'envoi des fichiers vers Cloudflare R2",
                error: error.message 
            });
        }

        // Connexion SQL
        connecter((error, connection) => {
            if (error) {
                return res.status(500).json({ message: "Erreur de connexion à la base de données" });
            }

            connection.beginTransaction((err) => {
                if (err) {
                    return res.status(500).json({ message: "Erreur lors du démarrage de la transaction" });
                }

                const insertProduitQuery = `
                    INSERT INTO produits 
                    (nom, description, prix, prix_promo, en_promo, vedette, personnalisable, stock_status, code_barre, collection_id, categorie_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                connection.query(
                    insertProduitQuery,
                    [nom, description, prix, prix_promo, enPromoBoolean, vedetteBoolean, personnalisableBoolean, stock_status, code_barre, collection_id, categorie_id],
                    (err, result) => {

                        if (err) {
                            return connection.rollback(() => {
                                console.error("Erreur SQL:", err);
                                res.status(500).json({ message: "Erreur lors de la création du produit" });
                            });
                        }

                        const produit_id = result.insertId;
                        const promises = [];

                        // --- 📌 Ajouter les médias (URL R2) ---
                        urlsR2.forEach((url, index) => {
                            const typeMedia = /\.(mp4|webm|mov|avi)$/i.test(url) ? "video" : "image";

                            const insertMediaQuery = `
                                INSERT INTO produit_medias (produit_id, media_url, type_media, is_principal, ordre)
                                VALUES (?, ?, ?, ?, ?)
                            `;

                            promises.push(new Promise((resolve, reject) => {
                                connection.query(
                                    insertMediaQuery,
                                    [produit_id, url, typeMedia, index === 0, index + 1],
                                    (err, result) => err ? reject(err) : resolve(result)
                                );
                            }));
                        });

                        // --- Couleurs ---
                        const couleursArray = Array.isArray(couleurs) ? couleurs : JSON.parse(couleurs || "[]");
                        couleursArray.forEach(couleur_id => {
                            promises.push(new Promise((resolve, reject) => {
                                connection.query(
                                    "INSERT INTO produit_couleurs (produit_id, couleur_id) VALUES (?, ?)",
                                    [produit_id, couleur_id],
                                    (err, result) => err ? reject(err) : resolve(result)
                                );
                            }));
                        });

                        // --- Tailles ---
                        const taillesArray = Array.isArray(tailles) ? tailles : JSON.parse(tailles || "[]");
                        taillesArray.forEach(taille_id => {
                            promises.push(new Promise((resolve, reject) => {
                                connection.query(
                                    "INSERT INTO produit_tailles (produit_id, taille_id) VALUES (?, ?)",
                                    [produit_id, taille_id],
                                    (err, result) => err ? reject(err) : resolve(result)
                                );
                            }));
                        });

                        // Final commit
                        Promise.all(promises)
                            .then(() => {
                                connection.commit(() => {
                                    res.status(201).json({
                                        message: "Produit créé avec succès",
                                        produit: {
                                            id: produit_id,
                                            nom,
                                            prix,
                                            medias: urlsR2
                                        }
                                    });
                                });
                            })
                            .catch((err) => {
                                connection.rollback(() => {
                                    console.error("Erreur caractéristiques:", err);
                                    res.status(500).json({ message: "Erreur lors de l'ajout des caractéristiques" });
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
        stock_status,
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

        if (stock_status) {
            whereClause += " AND p.stock_status = ?";
            queryParams.push(stock_status);
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
                (SELECT media_url FROM produit_medias WHERE produit_id = p.id AND is_principal = 1 LIMIT 1) as image_principale,
                (SELECT COUNT(*) FROM produit_medias WHERE produit_id = p.id) as nombre_medias
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

            // Récupérer les médias (images et vidéos)
            const mediasQuery = `SELECT * FROM produit_medias WHERE produit_id = ? ORDER BY ordre ASC`;
            
            connection.query(mediasQuery, [id], (err, mediasResults) => {
                if (err) {
                    console.error("Erreur lors de la récupération des médias:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la récupération des médias" 
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
                            images: mediasResults.filter(m => m.type_media === 'image'),
                            videos: mediasResults.filter(m => m.type_media === 'video'),
                            medias: mediasResults,
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
                (SELECT media_url FROM produit_medias WHERE produit_id = p.id AND is_principal = 1 LIMIT 1) as image_principale
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
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({ 
                message: "Erreur lors de l'upload des médias",
                error: err.message 
            });
        }

        console.log("🔄 DEBUG - updateProduit appelé pour produit ID:", req.body.id);
        console.log("🔄 DEBUG - Données reçues:", Object.keys(req.body));
        console.log("🔄 DEBUG - Fichiers reçus:", req.files ? req.files.length : 0);

        const {
            id,
            nom,
            description,
            prix,
            prix_promo,
            en_promo = false,
            vedette = false,
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
        const vedetteBoolean = vedette === 'true' || vedette === true;
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

        // --- 📌 UPLOAD nouveaux médias vers Cloudflare R2 ---
        let urlsR2 = [];
        if (req.files && req.files.length > 0) {
            try {
                urlsR2 = await uploadImagesToR2(req.files, "dev/produits");
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
                    SET nom = ?, description = ?, prix = ?, prix_promo = ?, en_promo = ?, vedette = ?, 
                        personnalisable = ?, stock_status = ?, code_barre = ?, collection_id = ?, categorie_id = ?, updated_at = NOW()
                    WHERE id = ?
                `;

                connection.query(
                    updateProduitQuery,
                    [nom, description, prix, prix_promo, enPromoBoolean, vedetteBoolean, personnalisableBoolean, stock_status, code_barre, collection_id, categorie_id, id],
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

                        // --- 📌 SUPPRIMER médias existants si spécifié ---
                        const deletedMediaIds = req.body.deletedMediaIds ? JSON.parse(req.body.deletedMediaIds) : [];
                        console.log("🗑️ DEBUG - deletedMediaIds reçus:", deletedMediaIds);
                        console.log("🗑️ DEBUG - req.body.deletedMediaIds brut:", req.body.deletedMediaIds);
                        if (deletedMediaIds.length > 0) {
                            const deleteMediaQuery = `DELETE FROM produit_medias WHERE id IN (${deletedMediaIds.map(() => '?').join(',')}) AND produit_id = ?`;
                            promises.push(new Promise((resolve, reject) => {
                                connection.query(deleteMediaQuery, [...deletedMediaIds, id], (err, result) => {
                                    if (err) {
                                        console.error("Erreur suppression médias:", err);
                                        reject(err);
                                    } else {
                                        console.log(`${result.affectedRows} médias supprimés`);
                                        resolve(result);
                                    }
                                });
                            }));
                        }

                        // Ajouter nouveaux médias si fournis
                        if (urlsR2.length > 0) {
                            // Récupérer le nombre de médias existants pour l'ordre
                            const getMediaCountQuery = `SELECT COUNT(*) as count FROM produit_medias WHERE produit_id = ?`;
                            
                            promises.push(new Promise((resolve, reject) => {
                                connection.query(getMediaCountQuery, [id], (err, countResult) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    
                                    const startOrder = countResult[0].count;
                                    const mediaPromises = [];
                                    
                                    urlsR2.forEach((url, index) => {
                                        // Déterminer le type de média
                                        const isVideo = /\.(mp4|webm|mov|avi)$/i.test(url);
                                        const typeMedia = isVideo ? 'video' : 'image';
                                        
                                        const insertMediaQuery = `
                                            INSERT INTO produit_medias (produit_id, media_url, type_media, is_principal, ordre) 
                                            VALUES (?, ?, ?, ?, ?)
                                        `;
                                        
                                        mediaPromises.push(new Promise((resolveMedia, rejectMedia) => {
                                            connection.query(
                                                insertMediaQuery,
                                                [id, url, typeMedia, startOrder === 0 && index === 0, startOrder + index + 1],
                                                (err, result) => {
                                                    if (err) rejectMedia(err);
                                                    else resolveMedia(result);
                                                }
                                            );
                                        }));
                                    });
                                    
                                    Promise.all(mediaPromises).then(resolve).catch(reject);
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
                                            medias: urlsR2
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

// Lister les produits vedettes pour la page d'accueil
const listProduitsVedettes = async (req, res) => {
    const { limit = 8 } = req.query;

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                p.*,
                c.nom as collection_nom,
                cat.nom as categorie_nom,
                (SELECT media_url FROM produit_medias WHERE produit_id = p.id AND is_principal = 1 LIMIT 1) as image_principale,
                (SELECT COUNT(*) FROM produit_medias WHERE produit_id = p.id) as nombre_medias
            FROM produits p
            LEFT JOIN collections c ON p.collection_id = c.id
            LEFT JOIN categories cat ON p.categorie_id = cat.id
            WHERE p.vedette = TRUE
            ORDER BY p.created_at DESC
            LIMIT ?
        `;

        connection.query(query, [parseInt(limit)], (err, results) => {
            connection.end();
            
            if (err) {
                console.error("Erreur lors de la récupération des produits vedettes:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des produits vedettes",
                    error: err.message 
                });
            }

            res.status(200).json({
                message: "Produits vedettes récupérés avec succès",
                produits: results
            });
        });
    });
};

// Supprimer un média spécifique
const deleteMedia = async (req, res) => {
    const { mediaId, produitId } = req.body;

    console.log("🗑️ DELETE MEDIA - ID média:", mediaId, "ID produit:", produitId);

    if (!mediaId || !produitId) {
        return res.status(400).json({ message: "L'ID du média et l'ID du produit sont requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        // Supprimer le média en vérifiant qu'il appartient bien au produit
        const deleteQuery = `DELETE FROM produit_medias WHERE id = ? AND produit_id = ?`;
        
        connection.query(deleteQuery, [mediaId, produitId], (err, result) => {
            connection.end();
            
            if (err) {
                console.error("Erreur lors de la suppression du média:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la suppression du média",
                    error: err.message 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Média non trouvé ou n'appartient pas à ce produit" });
            }

            console.log("✅ Média supprimé avec succès - ID:", mediaId);

            res.status(200).json({
                message: "Média supprimé avec succès",
                mediaId,
                produitId
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
    listallProduitpagine,
    listProduitsVedettes,
    deleteMedia
};
