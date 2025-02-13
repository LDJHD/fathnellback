require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connecter } = require('../../bd/connect');

const app = express();
const path = require("path");

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à la base de données
connecter((erreur) => {
    if (erreur) {
        console.log("Erreur lors de la connexion avec la base de données MySQL");
        process.exit(-1);
    } else {
        console.log("Connexion avec la base de données établie");
        app.listen(5000, () => {
            console.log("En attente des requêtes sur le port 5000");
        });
    }
});

// Chargement des routes avec path.resolve
const routes = [
    require(path.resolve(__dirname, "../route/utilisateur")),
    require(path.resolve(__dirname, "../route/client")),
    require(path.resolve(__dirname, "../route/categorie")),
    require(path.resolve(__dirname, "../route/detailcommande")),
    require(path.resolve(__dirname, "../route/facture")),
    require(path.resolve(__dirname, "../route/facturation")),
    require(path.resolve(__dirname, "../route/fournisseur")),
    require(path.resolve(__dirname, "../route/produit")),
    require(path.resolve(__dirname, "../route/stock")),
    require(path.resolve(__dirname, "../route/vente")),
    require(path.resolve(__dirname, "../route/mail")),
    require(path.resolve(__dirname, "../route/login")),
    require(path.resolve(__dirname, "../route/deconnexion")),
    require(path.resolve(__dirname, "../route/pdfRoutes")),
    require(path.resolve(__dirname, "../route/invoice")),
    require(path.resolve(__dirname, "../route/supplement")),
];

routes.forEach(route => app.use("/api/v1", route));

// Servir les fichiers PDF
app.use("/factures", express.static(path.join(__dirname, "factures")));
app.use("/pdf", express.static(path.join(__dirname, "pdf")));
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

module.exports = app;
