// routes/categorie.js

const express = require('express');
const {
    listallCategories,
    ajouterCategorie,
    detailCategorie,
    updateCategorie,
    deleteCategorie,
    getCategoriesPrincipales,
    getSousCategories
} = require('../controller/categorie');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Routes publiques
router.get('/categorie/listall', listallCategories);
router.get('/categorie/principales', getCategoriesPrincipales);

// Routes sans authentification
router.post('/categorie/create',authenticateToken, ajouterCategorie);
router.post('/categorie/detailById', detailCategorie);
router.post('/categorie/delete', deleteCategorie);
router.post('/categorie/update',authenticateToken, updateCategorie);
router.post('/categorie/sous-categories', getSousCategories);

// Alias pour compatibilité
router.get('/categorie/listall', listallCategories);
router.post('/categorie/detailById', detailCategorie);
module.exports = router;
