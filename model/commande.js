class Commande {
    constructor(data) {
        this.id = data.id;
        this.numero_commande = data.numero_commande;
        this.montant_total = data.montant_total;
        this.status = data.status;
        this.session_id = data.session_id;
        this.user_id = data.user_id;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Relations
        this.details = data.details || [];
    }
}

class CommandeDetail {
    constructor(data) {
        this.id = data.id;
        this.commande_id = data.commande_id;
        this.produit_id = data.produit_id;
        this.quantite = data.quantite;
        this.prix_unitaire = data.prix_unitaire;
        this.personnalise = data.personnalise;
        this.couleur_id = data.couleur_id;
        this.taille_id = data.taille_id;
        this.created_at = data.created_at;
        
        // Relations
        this.produit = data.produit || null;
        this.couleur = data.couleur || null;
        this.taille = data.taille || null;
    }
}

module.exports = { Commande, CommandeDetail };
