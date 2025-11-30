const express = require('express');
const {
    getWishlist,
    ajouterAWishlist,
    supprimerDeWishlist,
    checkProduitInWishlist
} = require('../controller/wishlist');

const router = express.Router();

// Routes de la wishlist (pas besoin d'auth, on utilise session_id)
router.post('/wishlist/get', getWishlist);
router.post('/wishlist/ajouter', ajouterAWishlist);
router.post('/wishlist/supprimer', supprimerDeWishlist);
router.post('/wishlist/check', checkProduitInWishlist);

module.exports = router;

