// routes/categorie.js

const express = require('express');
const {
    ajouterCategorie,
    listallCategorie,
    detailCategorie,
    deleteCategorie,
    updateCategorie,
    countUserCategorie,
    countCategorie
} = require('../controller/categorie');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/categorie/create',authenticateToken, ajouterCategorie);
router.get('/categorie/listall',authenticateToken, listallCategorie);
router.post('/categorie/detailById',authenticateToken, detailCategorie);
router.post('/categorie/delete',authenticateToken, deleteCategorie);
router.post('/categorie/update',authenticateToken, updateCategorie);
router.post('/categorie/countUserCategorie',authenticateToken, countUserCategorie);
router.get('/categorie/countCategorie', countCategorie);
module.exports = router;
