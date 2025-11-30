const express = require('express');
const {
    getPanier,
    ajouterAuPanier,
    modifierQuantite,
    supprimerDuPanier
} = require('../controller/panier');

const router = express.Router();

// Routes du panier (pas besoin d'auth, on utilise session_id)
router.post('/panier/get', getPanier);
router.post('/panier/ajouter', ajouterAuPanier);
router.post('/panier/modifier-quantite', modifierQuantite);
router.post('/panier/supprimer-item', supprimerDuPanier);

module.exports = router;
