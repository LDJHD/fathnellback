const { connecter } = require("../bd/connect");

// Générer un numéro de commande unique
function genererNumeroCommande() {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CMD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${timestamp}${random}`;
}

// Créer une commande depuis le panier
const creerCommande = async (req, res) => {
    const { session_id } = req.body;

    if (!session_id) {
        return res.status(400).json({ message: "Session ID requis" });
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

            // Récupérer le panier et ses items avec toutes les informations
            const getPanierQuery = `
                SELECT 
                    pi.*,
                    p.nom as produit_nom,
                    p.prix as produit_prix_original,
                    c.nom as couleur_nom,
                    t.nom as taille_nom,
                    t.type as taille_type,
                    pi.texte_personnalisation
                FROM paniers pa
                JOIN panier_items pi ON pa.id = pi.panier_id
                JOIN produits p ON pi.produit_id = p.id
                LEFT JOIN couleurs c ON pi.couleur_id = c.id
                LEFT JOIN tailles t ON pi.taille_id = t.id
                WHERE pa.session_id = ?
            `;

            connection.query(getPanierQuery, [session_id], (err, panierItems) => {
                if (err) {
                    return connection.rollback(() => {
                        res.status(500).json({ 
                            message: "Erreur lors de la récupération du panier" 
                        });
                    });
                }

                if (panierItems.length === 0) {
                    return connection.rollback(() => {
                        res.status(400).json({ message: "Panier vide" });
                    });
                }

                // Calculer le montant total (articles non personnalisés uniquement)
                const montantTotal = panierItems
                    .filter(item => !item.personnalise)
                    .reduce((total, item) => total + (item.prix_unitaire * item.quantite), 0);

                // Créer la commande
                const numeroCommande = genererNumeroCommande();
                const createCommandeQuery = `
                    INSERT INTO commandes (numero_commande, montant_total, session_id, status) 
                    VALUES (?, ?, ?, 'tentative')
                `;

                connection.query(createCommandeQuery, [numeroCommande, montantTotal, session_id], (err, commandeResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            res.status(500).json({ 
                                message: "Erreur lors de la création de la commande" 
                            });
                        });
                    }

                    const commande_id = commandeResult.insertId;

                    // Ajouter les détails de la commande
                    const insertDetailsPromises = panierItems.map(item => {
                        return new Promise((resolve, reject) => {
                            const insertDetailQuery = `
                                INSERT INTO commande_details 
                                (commande_id, produit_id, quantite, prix_unitaire, personnalise, couleur_id, taille_id, texte_personnalisation) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            `;

                            connection.query(
                                insertDetailQuery,
                                [
                                    commande_id,
                                    item.produit_id,
                                    item.quantite,
                                    item.prix_unitaire,
                                    item.personnalise,
                                    item.couleur_id,
                                    item.taille_id,
                                    item.texte_personnalisation
                                ],
                                (err, result) => {
                                    if (err) reject(err);
                                    else resolve(result);
                                }
                            );
                        });
                    });

                    Promise.all(insertDetailsPromises)
                        .then(() => {
                            // Vider le panier après la création de la commande
                            const viderPanierQuery = `
                                DELETE pi FROM panier_items pi
                                JOIN paniers p ON pi.panier_id = p.id
                                WHERE p.session_id = ?
                            `;

                            connection.query(viderPanierQuery, [session_id], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        res.status(500).json({ 
                                            message: "Erreur lors du vidage du panier" 
                                        });
                                    });
                                }

                                // Valider la transaction
                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            res.status(500).json({ 
                                                message: "Erreur lors de la validation de la commande" 
                                            });
                                        });
                                    }

                                    // Préparer les détails des articles pour la réponse
                                    const articlesDetails = panierItems.map(item => ({
                                        produit_nom: item.produit_nom || 'Produit sans nom',
                                        quantite: item.quantite || 1,
                                        prix_unitaire: item.prix_unitaire || 0,
                                        prix_total: (item.prix_unitaire || 0) * (item.quantite || 1),
                                        personnalise: item.personnalise ? true : false,
                                        couleur: item.couleur_nom || null,
                                        taille: item.taille_nom || null,
                                        taille_type: item.taille_type || null,
                                        texte_personnalisation: item.texte_personnalisation || null
                                    }));

                                    console.log("📦 Articles préparés pour la réponse:", articlesDetails);
                                    console.log("📦 Nombre d'articles:", articlesDetails.length);

                                    res.status(201).json({
                                        message: "Commande créée avec succès",
                                        commande: {
                                            id: commande_id,
                                            numero_commande: numeroCommande,
                                            montant_total: montantTotal,
                                            nombre_articles: panierItems.length,
                                            articles: articlesDetails
                                        }
                                    });
                                });
                            });
                        })
                        .catch((err) => {
                            connection.rollback(() => {
                                res.status(500).json({ 
                                    message: "Erreur lors de l'ajout des détails de commande" 
                                });
                            });
                        });
                });
            });
        });
    });
};

// Lister les commandes avec filtres
const listallCommandes = async (req, res) => {
    const { limit = 50, offset = 0, status, periode } = req.body;

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        let whereClause = "WHERE 1=1";
        let queryParams = [];

        if (status) {
            whereClause += " AND c.status = ?";
            queryParams.push(status);
        }

        if (periode) {
            switch (periode) {
                case '3_jours':
                    whereClause += " AND c.created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)";
                    break;
                case '7_jours':
                    whereClause += " AND c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
                    break;
                case '30_jours':
                    whereClause += " AND c.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
                    break;
            }
        }

        const query = `
            SELECT 
                c.*,
                COUNT(cd.id) as nombre_articles,
                GROUP_CONCAT(
                    CONCAT(cd.quantite, 'x ', p.nom)
                    SEPARATOR ', '
                ) as articles_resume
            FROM commandes c
            LEFT JOIN commande_details cd ON c.id = cd.commande_id
            LEFT JOIN produits p ON cd.produit_id = p.id
            ${whereClause}
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));

        connection.query(query, queryParams, (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération des commandes:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération des commandes" 
                });
            }

            res.status(200).json({
                message: "Commandes récupérées avec succès",
                commandes: results
            });
        });
    });
};

// Détail d'une commande
const detailCommande = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "ID de commande requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                c.*,
                cd.id as detail_id,
                cd.quantite,
                cd.prix_unitaire,
                cd.personnalise,
                cd.texte_personnalisation,
                p.nom as produit_nom,
                p.description as produit_description,
                co.nom as couleur_nom,
                co.code_hex as couleur_code,
                t.nom as taille_nom,
                t.type as taille_type
            FROM commandes c
            JOIN commande_details cd ON c.id = cd.commande_id
            JOIN produits p ON cd.produit_id = p.id
            LEFT JOIN couleurs co ON cd.couleur_id = co.id
            LEFT JOIN tailles t ON cd.taille_id = t.id
            WHERE c.id = ?
            ORDER BY cd.id
        `;

        connection.query(query, [id], (err, results) => {
            if (err) {
                console.error("Erreur lors de la récupération de la commande:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la récupération de la commande" 
                });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Commande non trouvée" });
            }

            // Organiser les données
            const commande = {
                id: results[0].id,
                numero_commande: results[0].numero_commande,
                montant_total: results[0].montant_total,
                status: results[0].status,
                session_id: results[0].session_id,
                user_id: results[0].user_id,
                created_at: results[0].created_at,
                updated_at: results[0].updated_at,
                details: results.map(row => ({
                    id: row.detail_id,
                    quantite: row.quantite,
                    prix_unitaire: row.prix_unitaire,
                    personnalise: row.personnalise,
                    texte_personnalisation: row.texte_personnalisation,
                    produit: {
                        nom: row.produit_nom,
                        description: row.produit_description
                    },
                    couleur: row.couleur_nom ? {
                        nom: row.couleur_nom,
                        code_hex: row.couleur_code
                    } : null,
                    taille: row.taille_nom ? {
                        nom: row.taille_nom,
                        type: row.taille_type
                    } : null
                }))
            };

            res.status(200).json({
                message: "Commande récupérée avec succès",
                commande
            });
        });
    });
};

module.exports = {
    creerCommande,
    listallCommandes,
    detailCommande
};
