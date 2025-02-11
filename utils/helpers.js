const verifierProduitExistant = (connection, produit_id) => {
    return new Promise((resolve, reject) => {
        const queryCheckProduit = `SELECT id FROM produit WHERE id = ?`;
        connection.query(queryCheckProduit, [produit_id], (err, produitResult) => {
            if (err) {
                console.error("Erreur lors de la vérification du produit :", err);
                return reject(new Error("Erreur lors de la vérification du produit"));
            }

            if (produitResult.length === 0) {
                return reject(new Error("Le produit spécifié n'existe pas."));
            }


            resolve();
        });
    });
};

module.exports = { verifierProduitExistant };
