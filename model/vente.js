class Vente {
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
        this.nombre_articles = data.nombre_articles || 0;
        this.articles_resume = data.articles_resume || '';
    }
}

// Alias pour compatibilité - Vente = Commande
class Commande extends Vente {}

module.exports = { Vente, Commande };