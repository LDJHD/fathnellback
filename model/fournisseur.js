class Fournisseur{
    constructor(data){
        this.nom=data.nom;
        this.contact=data.contact;
        this.adresse=data.adresse;
        this.created_at = data.created_at; 
        this.updated_at = data.updated_at;
    }
}
module.exports={Fournisseur};