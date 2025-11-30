class Panier {
    constructor(data) {
        this.id = data.id;
        this.session_id = data.session_id;
        this.user_id = data.user_id;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Relations
        this.items = data.items || [];
    }
}

class PanierItem {
    constructor(data) {
        this.id = data.id;
        this.panier_id = data.panier_id;
        this.produit_id = data.produit_id;
        this.quantite = data.quantite;
        this.personnalise = data.personnalise;
        this.couleur_id = data.couleur_id;
        this.taille_id = data.taille_id;
        this.prix_unitaire = data.prix_unitaire;
        this.created_at = data.created_at;
        
        // Relations
        this.produit = data.produit || null;
        this.couleur = data.couleur || null;
        this.taille = data.taille || null;
    }
}

module.exports = { Panier, PanierItem };
