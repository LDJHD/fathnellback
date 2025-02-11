class Vente{
    constructor(data){
        this.montant_total=data.nom;
        this.client_id=data.client_id;
        this.created_at = data.created_at; 
        this.updated_at = data.updated_at;
    }
}
module.exports={Vente};