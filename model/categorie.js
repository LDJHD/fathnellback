class Categorie {
    constructor(data) {
        this.id = data.id;
        this.nom = data.nom;
        this.description = data.description;
        this.parent_id = data.parent_id;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Relations
        this.parent = data.parent || null;
        this.children = data.children || [];
        this.produits_count = data.produits_count || 0;
    }
}

module.exports = { Categorie };