const express = require('express');
const {
    ajouterProduit,
    listallProduit,
    detailProduit,
    deleteProduit,
    updateProduit,
    detailProduitScan,
    filtreBycodebarreorid,
    listallProduitpagine,
    listProduitsVedettes
} = require('../controller/produit');
const authenticateToken = require('../middleware/auth');


const router = express.Router();

router.post('/produit/create',authenticateToken, ajouterProduit); // Utilisez simplement `upload` comme middleware
router.get('/produit/listall', listallProduit);
router.get('/produit/vedettes', listProduitsVedettes); // Route publique pour la page d'accueil
router.post('/produit/detailById', detailProduit);
router.post('/produit/detailBycodebarre',authenticateToken, detailProduitScan);
router.post('/produit/filtreBycodebarre',authenticateToken, filtreBycodebarreorid);
router.post('/produit/delete',authenticateToken, deleteProduit);
router.post('/produit/updateProduit',updateProduit); // Utilisez `upload` ici aussi
router.post('/produit/listall/paginate', listallProduitpagine);

module.exports = router;
