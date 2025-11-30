class Collection {
    constructor(data) {
        this.id = data.id;
        this.nom = data.nom;
        this.description = data.description;
        this.image = data.image;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

module.exports = { Collection };
