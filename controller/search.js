const { connecter } = require('../bd/connect');

// Fonction de recherche de produits
const searchProducts = async (req, res) => {
    try {
        const { search, limit = 12, offset = 0 } = req.body;

        // Validation de base
        if (!search || search.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "Le terme de recherche doit contenir au moins 2 caractères"
            });
        }

        const searchTerm = search.trim();
        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);

        // Requête de recherche avec jointures pour récupérer les informations complètes
        const searchQuery = `
            SELECT 
                p.*,
                c.nom as collection_nom,
                cat.nom as categorie_nom,
                (SELECT media_url FROM produit_medias WHERE produit_id = p.id AND is_principal = 1 LIMIT 1) as image_principale,
                (SELECT COUNT(*) FROM produit_medias WHERE produit_id = p.id) as nombre_medias
            FROM produits p
            LEFT JOIN collections c ON p.collection_id = c.id
            LEFT JOIN categories cat ON p.categorie_id = cat.id
            WHERE 
                (p.nom LIKE ? OR 
                 p.description LIKE ? OR 
                 cat.nom LIKE ? OR 
                 c.nom LIKE ?) 
            ORDER BY 
                -- Priorité aux correspondances exactes dans le nom
                CASE WHEN p.nom LIKE ? THEN 1 ELSE 2 END,
                -- Puis par nom de produit
                p.nom ASC
            LIMIT ? OFFSET ?
        `;

        // Paramètres de la requête - utiliser LIKE pour la recherche partielle
        const searchPattern = `%${searchTerm}%`;
        const exactPattern = `%${searchTerm}%`;
        
        const params = [
            searchPattern,  // p.nom LIKE ?
            searchPattern,  // p.description LIKE ?
            searchPattern,  // cat.nom LIKE ?
            searchPattern,  // c.nom LIKE ?
            exactPattern,   // Pour le ORDER BY
            limitNum,       // LIMIT
            offsetNum       // OFFSET
        ];

        console.log('🔍 Recherche:', {
            terme: searchTerm,
            limit: limitNum,
            offset: offsetNum
        });

        // Utiliser la fonction connecter
        connecter((error, connection) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: "Erreur de connexion à la base de données"
                });
            }

            // Exécuter la requête
            connection.query(searchQuery, params, (err, results) => {
            if (err) {
                console.error('❌ Erreur lors de la recherche:', err);
                return res.status(500).json({
                    success: false,
                    message: "Erreur lors de la recherche"
                });
            }

            // Requête pour compter le total des résultats (pour la pagination)
            const countQuery = `
                SELECT COUNT(DISTINCT p.id) as total
                FROM produits p
                LEFT JOIN collections c ON p.collection_id = c.id
                LEFT JOIN categories cat ON p.categorie_id = cat.id
                WHERE 
                    (p.nom LIKE ? OR 
                     p.description LIKE ? OR 
                     cat.nom LIKE ? OR 
                     c.nom LIKE ?)
            `;

            const countParams = [searchPattern, searchPattern, searchPattern, searchPattern];

            connection.query(countQuery, countParams, (countErr, countResults) => {
                if (countErr) {
                    console.error('❌ Erreur lors du comptage:', countErr);
                    // Continuer même si le comptage échoue
                }

                const total = countResults && countResults[0] ? countResults[0].total : 0;
                const hasMore = (offsetNum + results.length) < total;

                console.log('✅ Résultats de recherche:', {
                    found: results.length,
                    total: total,
                    hasMore: hasMore
                });

                res.status(200).json({
                    success: true,
                    produits: results,
                    pagination: {
                        total: total,
                        limit: limitNum,
                        offset: offsetNum,
                        has_more: hasMore,
                        current_count: results.length
                    },
                    search_term: searchTerm
                });

                // Fermer la connexion
                connection.end();
            });
        });

        }); // Fermer connecter

    } catch (error) {
        console.error('❌ Erreur serveur lors de la recherche:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
};

module.exports = {
    searchProducts
};