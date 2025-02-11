const express = require('express');
const {
    ajouterFournisseur,
    listallFournisseur,
    detailFournisseur,
    deleteFournisseur,
    updateFournisseur,
    listUserFournisseur,
    getfournisseurCount
    
} = require('../controller/fournisseur');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/fournisseur/create',authenticateToken, ajouterFournisseur);
router.get('/fournisseur/listall',authenticateToken, listallFournisseur);
router.post('/fournisseur/detailById',authenticateToken, detailFournisseur);
router.post('/fournisseur/delete',authenticateToken, deleteFournisseur);
router.post('/fournisseur/update',authenticateToken, updateFournisseur);
router.get('/fournisseur/user',authenticateToken, listUserFournisseur);
router.get('/fournisseur/count',authenticateToken, getfournisseurCount);

module.exports = router;