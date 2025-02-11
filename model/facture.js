class Facture{
    constructor(data) {
       this.vente_id = data.vente_id;
       this.montant_total = data.montant_total;
       this.created_at = data.created_at;
       this.remise = data.remise;
       this.montant_paye = data.montant_paye;
       this.montant_restant = data.montant_restant;
       this.mode_paiement = data.mode_paiement;
       this.client_id = data.client_id;
       this.created_at = data.created_at;
       this.updated_at = data.updated_at;
       
   }
 }
 module.exports={Facture};