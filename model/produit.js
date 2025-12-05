class Produit {
    constructor(data) {
        this.id = data.id;
        this.nom = data.nom;
        this.description = data.description;
        this.prix = data.prix;
        this.prix_promo = data.prix_promo;
        this.en_promo = data.en_promo;
        this.vedette = data.vedette;
        this.personnalisable = data.personnalisable;
        this.stock_status = data.stock_status;
        this.code_barre = data.code_barre;
        this.collection_id = data.collection_id;
        this.categorie_id = data.categorie_id;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Relations
        this.collection = data.collection || null;
        this.categorie = data.categorie || null;
        this.images = data.images || [];
        this.couleurs = data.couleurs || [];
        this.tailles = data.tailles || [];
    }
}

module.exports = { Produit };