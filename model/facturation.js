class Facturation{
    constructor(data){
        this.facture_id = data.facture_id;
        this.pdf = data.pdf;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}
module.exports={Facturation};