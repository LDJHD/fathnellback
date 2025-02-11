class Client{
    constructor(data){
        this.nom=data.nom;
        this.prenom=data.prenom;
        this.email=data.email;
        this.telephone = data.telephone;
        this.ifu = data.ifu;
        this.created_at = data.created_at; 
        this.updated_at = data.updated_at;
    }
}
module.exports={Client};