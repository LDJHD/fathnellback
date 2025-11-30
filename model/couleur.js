class Couleur {
    constructor(data) {
        this.id = data.id;
        this.nom = data.nom;
        this.code_hex = data.code_hex;
        this.created_at = data.created_at;
    }
}

module.exports = { Couleur };
