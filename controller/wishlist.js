const { connecter } = require("../bd/connect");

// Récupérer la wishlist
const getWishlist = async (req, res) => {
    const { session_id } = req.body;

    if (!session_id) {
        return res.status(400).json({ message: "Session ID requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                wi.id as item_id,
                wi.produit_id,
                p.nom as produit_nom,
                p.description as produit_description,
                p.prix as produit_prix,
                p.prix_promo,
                p.en_promo,
                p.stock_status,
                (SELECT media_url FROM  produit_medias WHERE produit_id = p.id AND is_principal = 1 LIMIT 1) as image_principale
            FROM wishlist w
            JOIN wishlist_items wi ON w.id = wi.wishlist_id
            JOIN produits p ON wi.produit_id = p.id
            WHERE w.session_id = ?
            ORDER BY wi.created_at DESC
        `;

        connection.query(query, [session_id], (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération de la wishlist:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération de la wishlist" 
                });
            }

            res.status(200).json({
                message: "Wishlist récupérée avec succès",
                wishlist: results,
                nombre_items: results.length
            });
        });
    });
};

// Ajouter un produit à la wishlist
const ajouterAWishlist = async (req, res) => {
    const { session_id, produit_id } = req.body;

    if (!session_id || !produit_id) {
        return res.status(400).json({ 
            message: "Session ID et ID produit requis" 
        });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        // Vérifier si le produit existe
        const checkProduitQuery = `SELECT id FROM produits WHERE id = ?`;
        
        connection.query(checkProduitQuery, [produit_id], (err, produitResults) => {
            if (err) {
                console.error("Erreur lors de la vérification du produit:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la vérification du produit" 
                });
            }

            if (produitResults.length === 0) {
                return res.status(404).json({ message: "Produit non trouvé" });
            }

            // Créer ou récupérer la wishlist
            const getWishlistQuery = `SELECT id FROM wishlist WHERE session_id = ?`;
            
            connection.query(getWishlistQuery, [session_id], (err, wishlistResults) => {
                if (err) {
                    console.error("Erreur lors de la récupération de la wishlist:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la récupération de la wishlist" 
                    });
                }

                let wishlist_id;

                if (wishlistResults.length === 0) {
                    // Créer une nouvelle wishlist
                    const createWishlistQuery = `INSERT INTO wishlist (session_id) VALUES (?)`;
                    
                    connection.query(createWishlistQuery, [session_id], (err, createResult) => {
                        if (err) {
                            console.error("Erreur lors de la création de la wishlist:", err);
                            return res.status(500).json({ 
                                message: "Erreur lors de la création de la wishlist" 
                            });
                        }
                        
                        wishlist_id = createResult.insertId;
                        ajouterItem();
                    });
                } else {
                    wishlist_id = wishlistResults[0].id;
                    ajouterItem();
                }

                function ajouterItem() {
                    // Vérifier si le produit est déjà dans la wishlist
                    const checkItemQuery = `SELECT id FROM wishlist_items WHERE wishlist_id = ? AND produit_id = ?`;
                    
                    connection.query(checkItemQuery, [wishlist_id, produit_id], (err, checkResults) => {
                        if (err) {
                            console.error("Erreur lors de la vérification:", err);
                            return res.status(500).json({ 
                                message: "Erreur lors de la vérification" 
                            });
                        }

                        if (checkResults.length > 0) {
                            return res.status(200).json({
                                message: "Produit déjà dans la wishlist",
                                item_id: checkResults[0].id
                            });
                        }

                        // Ajouter le produit à la wishlist
                        const insertQuery = `INSERT INTO wishlist_items (wishlist_id, produit_id) VALUES (?, ?)`;

                        connection.query(
                            insertQuery, 
                            [wishlist_id, produit_id], 
                            (err, insertResult) => {
                                if (err) {
                                    console.error("Erreur lors de l'ajout:", err);
                                    return res.status(500).json({ 
                                        message: "Erreur lors de l'ajout à la wishlist" 
                                    });
                                }

                                res.status(201).json({
                                    message: "Produit ajouté à la wishlist avec succès",
                                    item_id: insertResult.insertId
                                });
                            }
                        );
                    });
                }
            });
        });
    });
};

// Supprimer un produit de la wishlist
const supprimerDeWishlist = async (req, res) => {
    const { session_id, produit_id } = req.body;

    if (!session_id || !produit_id) {
        return res.status(400).json({ message: "Session ID et ID produit requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        // Récupérer la wishlist
        const getWishlistQuery = `SELECT id FROM wishlist WHERE session_id = ?`;
        
        connection.query(getWishlistQuery, [session_id], (err, wishlistResults) => {
            if (err) {
                console.error("Erreur lors de la récupération de la wishlist:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération de la wishlist" 
                });
            }

            if (wishlistResults.length === 0) {
                return res.status(404).json({ message: "Wishlist non trouvée" });
            }

            const wishlist_id = wishlistResults[0].id;

            // Supprimer l'item
            const deleteQuery = `DELETE FROM wishlist_items WHERE wishlist_id = ? AND produit_id = ?`;

            connection.query(deleteQuery, [wishlist_id, produit_id], (err, result) => {
                if (err) {
                    console.error("Erreur lors de la suppression:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la suppression de l'item" 
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Produit non trouvé dans la wishlist" });
                }

                res.status(200).json({
                    message: "Produit supprimé de la wishlist avec succès"
                });
            });
        });
    });
};

// Vérifier si un produit est dans la wishlist
const checkProduitInWishlist = async (req, res) => {
    const { session_id, produit_id } = req.body;

    if (!session_id || !produit_id) {
        return res.status(400).json({ message: "Session ID et ID produit requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT wi.id 
            FROM wishlist w
            JOIN wishlist_items wi ON w.id = wi.wishlist_id
            WHERE w.session_id = ? AND wi.produit_id = ?
            LIMIT 1
        `;

        connection.query(query, [session_id, produit_id], (err, results) => {
            if (err) {
                console.error("Erreur lors de la vérification:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la vérification" 
                });
            }

            res.status(200).json({
                isInWishlist: results.length > 0
            });
        });
    });
};

module.exports = {
    getWishlist,
    ajouterAWishlist,
    supprimerDeWishlist,
    checkProduitInWishlist
};

