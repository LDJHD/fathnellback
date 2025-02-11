class Stock{
    constructor(data) {
       this.produit_id = data.produit_id;
       this.quantite_stock = data.quantite_stock;
       this.statut = data.statut;
       this.created_at = data.created_at;
       this.updated_at = data.updated_at;
   }
 }
 module.exports={Stock};