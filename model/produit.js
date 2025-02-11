class Produit{
    constructor(data) {
       this.nom = data.nom;
       this.description = data.description;
       this.prix = data.prix;
       this.categorie_id = data.categorie_id;
       this.created_at = data.created_at;
       this.updated_at = data.updated_at;
       this.code_barre = data.code_barre;
   }
 }
 module.exports={Produit};