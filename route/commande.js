const express = require('express');
const {
    creerCommande,
    listallCommandes,
    detailCommande
} = require('../controller/commande');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Route publique pour créer une commande
router.post('/commande/creer', creerCommande);

// Routes admin pour gérer les commandes
router.post('/commande/listall',authenticateToken, listallCommandes);
router.post('/commande/detailById', detailCommande);

module.exports = router;
