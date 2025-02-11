const express = require('express');
const {
    ajouterVente,
    ajouterTransaction,
    listallVente,
    detailVente,
    deleteVente,
    updateVente,
    listUserVente,
    getventedayCount,
    getventemontantdayCount,
    listVentesearch,
    listVenteProduitsearchSom
    
} = require('../controller/vente');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/vente/create',authenticateToken, ajouterVente);
router.post('/vente/transaction',authenticateToken, ajouterTransaction);
router.get('/vente/listall',authenticateToken, listallVente);
router.post('/vente/detailById',authenticateToken, detailVente);
router.post('/vente/delete',authenticateToken, deleteVente);
router.post('/vente/update',authenticateToken, updateVente);
router.get('/vente/user',authenticateToken, listUserVente);
router.get('/vente/day',authenticateToken, getventedayCount);
router.get('/vente/montantday',authenticateToken, getventemontantdayCount);
router.post('/vente/ventesearch',authenticateToken, listVentesearch);
router.post('/vente/ventesearch/som',authenticateToken, listVenteProduitsearchSom);
module.exports = router;