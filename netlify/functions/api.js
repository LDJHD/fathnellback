const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const { connecter } = require('./bd/connect');
const app = express();

const envoyerEmail = require('./controller/mailer');

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL, // Permet les requêtes depuis le frontend
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
    }
});

// Routes API
const routes = [
    require("./route/utilisateur"),
    require("./route/client"),
    require("./route/categorie"),
    require("./route/detailcommande"),
    require("./route/facture"),
    require("./route/facturation"),
    require("./route/fournisseur"),
    require("./route/produit"),
    require("./route/stock"),
    require("./route/vente"),
    require("./route/mail"),
    require("./route/login"),
    require("./route/deconnexion"),
    require("./route/pdfRoutes"),
    require("./route/invoice"),
    require("./route/supplement"),
];

routes.forEach(route => app.use("/api/v1", route));

// Route pour envoyer un email
app.post('/envoyerEmail', (req, res) => {
    const { to, subject, body } = req.body;
    envoyerEmail(to, subject, body);
    res.status(200).json({ message: 'Email envoyé avec succès!' });
});

// Exporter pour Netlify
module.exports.handler = serverless(app);
