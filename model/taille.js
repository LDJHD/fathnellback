class Taille {
    constructor(data) {
        this.id = data.id;
        this.nom = data.nom;
        this.type = data.type; // 'pointure', 'taille_vetement', 'dimension'
        this.created_at = data.created_at;
    }
}

module.exports = { Taille };
