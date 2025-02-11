class Stock{
    constructor(data) {
       this.produit_id = data.produit_id;
       this.prix = data.prix;
       this.unit = data.unit;
       this.created_at = data.created_at;
       this.updated_at = data.updated_at;
   }
 }
 module.exports={Stock};