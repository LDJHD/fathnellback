const { connecter } = require("../bd/connect");

// Récupérer le panier
const getPanier = async (req, res) => {
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
                pi.*,
                p.nom as produit_nom,
                p.description as produit_description,
                p.prix as produit_prix_original,
                p.stock_status,
                p.en_promo,
                p.prix_promo,
                c.nom as couleur_nom,
                c.code_hex as couleur_code,
                t.nom as taille_nom,
                t.type as taille_type,
                (SELECT image_url FROM produit_images WHERE produit_id = p.id AND is_principal = 1 LIMIT 1) as image_principale
            FROM paniers pa
            JOIN panier_items pi ON pa.id = pi.panier_id
            JOIN produits p ON pi.produit_id = p.id
            LEFT JOIN couleurs c ON pi.couleur_id = c.id
            LEFT JOIN tailles t ON pi.taille_id = t.id
            WHERE pa.session_id = ?
            ORDER BY pi.created_at DESC
        `;

        connection.query(query, [session_id], (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération du panier:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération du panier" 
                });
            }

            // Séparer les articles personnalisés et non personnalisés
            const articlesNonPersonnalises = results.filter(item => !item.personnalise);
            const articlesPersonnalises = results.filter(item => item.personnalise);

            // Calculer le total (sans les articles personnalisés)
            const totalNonPersonnalises = articlesNonPersonnalises.reduce(
                (total, item) => total + (item.prix_unitaire * item.quantite), 0
            );

            res.status(200).json({
                message: "Panier récupéré avec succès",
                panier: {
                    articles_non_personnalises: articlesNonPersonnalises,
                    articles_personnalises: articlesPersonnalises,
                    total_non_personnalises: totalNonPersonnalises,
                    nombre_items: results.length
                }
            });
        });
    });
};

// Ajouter un article au panier
const ajouterAuPanier = async (req, res) => {
    const { 
        session_id, 
        produit_id, 
        quantite = 1, 
        personnalise = false, 
        couleur_id = null, 
        taille_id = null 
    } = req.body;

    if (!session_id || !produit_id) {
        return res.status(400).json({ 
            message: "Session ID et ID produit requis" 
        });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        // D'abord, récupérer le prix du produit
        const getProduitQuery = `SELECT prix, prix_promo, en_promo FROM produits WHERE id = ?`;
        
        connection.query(getProduitQuery, [produit_id], (err, produitResults) => {
            if (err) {
                console.error("Erreur lors de la récupération du produit:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération du produit" 
                });
            }

            if (produitResults.length === 0) {
                return res.status(404).json({ message: "Produit non trouvé" });
            }

            const produit = produitResults[0];
            const prix_unitaire = produit.en_promo ? produit.prix_promo : produit.prix;

            // Créer ou récupérer le panier
            const getPanierQuery = `SELECT id FROM paniers WHERE session_id = ?`;
            
            connection.query(getPanierQuery, [session_id], (err, panierResults) => {
                if (err) {
                    console.error("Erreur lors de la récupération du panier:", err);
                    return res.status(500).json({ 
                        message: "Erreur lors de la récupération du panier" 
                    });
                }

                let panier_id;

                if (panierResults.length === 0) {
                    // Créer un nouveau panier
                    const createPanierQuery = `INSERT INTO paniers (session_id) VALUES (?)`;
                    
                    connection.query(createPanierQuery, [session_id], (err, createResult) => {
                        if (err) {
                            console.error("Erreur lors de la création du panier:", err);
                            return res.status(500).json({ 
                                message: "Erreur lors de la création du panier" 
                            });
                        }
                        
                        panier_id = createResult.insertId;
                        ajouterItem();
                    });
                } else {
                    panier_id = panierResults[0].id;
                    ajouterItem();
                }

                function ajouterItem() {
                    // Ajouter un nouvel item
                    const insertQuery = `
                        INSERT INTO panier_items 
                        (panier_id, produit_id, quantite, personnalise, couleur_id, taille_id, prix_unitaire) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;

                    connection.query(
                        insertQuery, 
                        [panier_id, produit_id, quantite, personnalise, couleur_id, taille_id, prix_unitaire], 
                        (err, insertResult) => {
                            if (err) {
                                console.error("Erreur lors de l'ajout:", err);
                                return res.status(500).json({ 
                                    message: "Erreur lors de l'ajout au panier" 
                                });
                            }

                            res.status(201).json({
                                message: "Produit ajouté au panier avec succès",
                                item_id: insertResult.insertId
                            });
                        }
                    );
                }
            });
        });
    });
};

// Modifier la quantité d'un article
const modifierQuantite = async (req, res) => {
    const { item_id, quantite } = req.body;

    if (!item_id || !quantite || quantite < 1) {
        return res.status(400).json({ 
            message: "ID de l'item et quantité valide requis" 
        });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `UPDATE panier_items SET quantite = ? WHERE id = ?`;

        connection.query(query, [quantite, item_id], (err, result) => {
            if (err) {
                console.error("Erreur lors de la modification:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la modification de la quantité" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Item non trouvé" });
            }

            res.status(200).json({
                message: "Quantité modifiée avec succès"
            });
        });
    });
};

// Supprimer un article du panier
const supprimerDuPanier = async (req, res) => {
    const { item_id } = req.body;

    if (!item_id) {
        return res.status(400).json({ message: "ID de l'item requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `DELETE FROM panier_items WHERE id = ?`;

        connection.query(query, [item_id], (err, result) => {
            if (err) {
                console.error("Erreur lors de la suppression:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la suppression de l'item" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Item non trouvé" });
            }

            res.status(200).json({
                message: "Item supprimé avec succès"
            });
        });
    });
};

module.exports = {
    getPanier,
    ajouterAuPanier,
    modifierQuantite,
    supprimerDuPanier
};
