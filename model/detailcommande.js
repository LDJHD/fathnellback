class Detail_commande{
    constructor(data) {
       this.commande_id= data.commande_id;
       this.produit_id = data.produit_id;
       this.quantite = data.quantite;
       this.prix_unitaire = data.prix_unitaire;
       this.created_at = data.created_at;
       this.updated_at = data.updated_at;
       
   }
 }
 module.exports={Detail_commande};