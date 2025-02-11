class Utilisateur{
   constructor(data) {
      this.nom = data.nom;
      this.prenom = data.prenom;
      this.email = data.email;
      this.password = data.password;
      this.statut = data.statut;
      this.pays = data.pays;
      this.whatsapp = data.whatsapp;
      this.actif = data.actif;
      this.created_at = data.created_at;
      this.updated_at = data.updated_at;
  }
}
module.exports={Utilisateur};