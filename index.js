const express = require('express');
const cors = require('cors');
const { connecter } = require('./bd/connect');
const path = require("path");
const verifierNotifications = require("./cron/notification");
const verifierNotificationsstock = require("./cron/notificationstock");

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à la base de données une seule fois
connecter((erreur, pool) => {
    if (erreur) {
        console.error("❌ Erreur de connexion MySQL :", erreur);
        process.exit(-1);
    } else {
        console.log("✅ Connexion MySQL établie.");
        app.listen(5000, () => {
            console.log("🚀 Serveur démarré sur le port 5000.");
        });
    }
});

// Routes API
const routes = [
    require("./route/utilisateur"),
    require("./route/client"),
    require("./route/categorie"),
    require("./route/unit"),
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
    require("./route/notification"),
];

verifierNotifications();
verifierNotificationsstock();

routes.forEach(route => app.use("/api/v1", route));

// Servir les fichiers PDF
app.use("/factures", express.static(path.join(__dirname, "factures")));
app.use("/pdf", express.static(path.join(__dirname, "pdf")));
app.use("/invoices", express.static(path.join(__dirname, "invoices")));

module.exports = app;
