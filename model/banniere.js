class Banniere {
    constructor(data) {
        this.id = data.id;
        this.titre = data.titre;
        this.description = data.description;
        this.image_url = data.image_url;
        this.ordre = data.ordre;
        this.actif = data.actif;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

module.exports = { Banniere };