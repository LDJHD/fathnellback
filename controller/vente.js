const { connecter } = require("../bd/connect");

// Génération numéro de commande
function genererNumeroCommande() {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CMD-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${timestamp}${random}`;
}

// Ajouter une vente/commande (pour compatibilité)
const ajouterVente = async (req, res) => {
    const { montant_total, session_id, user_id } = req.body;

    if (!montant_total) {
        return res.status(400).json({ message: "Le montant total est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const numeroCommande = genererNumeroCommande();
        const query = `
            INSERT INTO commandes (numero_commande, montant_total, session_id, user_id, status) 
            VALUES (?, ?, ?, ?, 'tentative')
        `;

        connection.query(query, [numeroCommande, montant_total, session_id, user_id], (err, result) => {
            if (err) {
                console.error("Erreur lors de l'ajout de la commande:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de l'ajout de la commande",
                    error: err.message 
                });
            }

            res.status(201).json({
                message: "Commande créée avec succès",
                commande: {
                    id: result.insertId,
                    numero_commande: numeroCommande,
                    montant_total,
                    status: 'tentative'
                }
            });
        });
    });
};

// Lister toutes les ventes/commandes
const listallVentes = async (req, res) => {
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
                    message: "Erreur lors de la récupération des commandes",
                    error: err.message 
                });
            }

            res.status(200).json({
                message: "Commandes récupérées avec succès",
                ventes: results // Garder 'ventes' pour compatibilité frontend
            });
        });
    });
};

// Détail d'une vente/commande
const detailVente = async (req, res) => {
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
                p.nom as produit_nom,
                p.description as produit_description,
                co.nom as couleur_nom,
                co.code_hex as couleur_code,
                t.nom as taille_nom,
                t.type as taille_type
            FROM commandes c
            LEFT JOIN commande_details cd ON c.id = cd.commande_id
            LEFT JOIN produits p ON cd.produit_id = p.id
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
                details: results.filter(row => row.detail_id).map(row => ({
                    id: row.detail_id,
                    quantite: row.quantite,
                    prix_unitaire: row.prix_unitaire,
                    personnalise: row.personnalise,
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
                vente: commande // Garder 'vente' pour compatibilité
            });
        });
    });
};

// Modifier le statut d'une vente/commande
const updateVente = async (req, res) => {
    const { id, status, montant_total } = req.body;

    if (!id) {
        return res.status(400).json({ message: "ID requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        let query = "UPDATE commandes SET updated_at = CURRENT_TIMESTAMP";
        let params = [];

        if (status) {
            const statusValides = ['tentative', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'];
            if (!statusValides.includes(status)) {
                return res.status(400).json({ 
                    message: "Statut invalide",
                    status_valides: statusValides
                });
            }
            query += ", status = ?";
            params.push(status);
        }

        if (montant_total) {
            query += ", montant_total = ?";
            params.push(montant_total);
        }

        query += " WHERE id = ?";
        params.push(id);

        connection.query(query, params, (err, result) => {
            if (err) {
                console.error("Erreur lors de la mise à jour:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la mise à jour de la commande" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Commande non trouvée" });
            }

            res.status(200).json({
                message: "Commande mise à jour avec succès"
            });
        });
    });
};

// Supprimer une vente/commande
const deleteVente = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "L'ID est requis" });
    }

    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `DELETE FROM commandes WHERE id = ?`;

        connection.query(query, [id], (err, result) => {
            if (err) {
                console.error("Erreur lors de la suppression:", err);
                return res.status(500).json({ 
                    message: "Erreur lors de la suppression de la commande" 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Commande non trouvée" });
            }

            res.status(200).json({
                message: "Commande supprimée avec succès"
            });
        });
    });
};

// Statistiques des ventes
const statsVentes = async (req, res) => {
    connecter((error, connection) => {
        if (error) {
            return res.status(500).json({ message: "Erreur de connexion à la base de données" });
        }

        const query = `
            SELECT 
                COUNT(*) as total_commandes,
                SUM(montant_total) as chiffre_affaires,
                AVG(montant_total) as panier_moyen,
                SUM(CASE WHEN status = 'confirmee' THEN 1 ELSE 0 END) as commandes_confirmees,
                SUM(CASE WHEN status = 'tentative' THEN 1 ELSE 0 END) as commandes_tentatives
            FROM commandes
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `;

        connection.query(query, (err, results) => {
            if (err) {
                console.error("Erreur lors du calcul des statistiques:", err);
                return res.status(500).json({ 
                    message: "Erreur lors du calcul des statistiques" 
                });
            }

            res.status(200).json({
                message: "Statistiques récupérées avec succès",
                stats: results[0]
            });
        });
    });
};

// Fonctions pour compatibilité avec l'ancien système
const listall = listallVentes;
const detail = detailVente;
const update = updateVente;
const ajouter = ajouterVente;
const supprimer = deleteVente;

module.exports = {
    ajouterVente,
    listallVentes,
    detailVente,
    updateVente,
    deleteVente,
    statsVentes,
    // Aliases pour compatibilité
    listall,
    detail,
    update,
    ajouter,
    supprimer
};
