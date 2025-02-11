class Categorie{
    constructor(data){
        this.nom=data.nom;
        this.user_id = data.user_id;
        this.created_at = data.created_at; 
        this.updated_at = data.updated_at;
    }
}
module.exports={Categorie};