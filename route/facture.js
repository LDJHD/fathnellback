const express = require('express');
const {
    ajouterFacture,
    listallFacture,
    detailFacture,
    deleteFacture,
    updateFacture,
    listUserFacture,
    
} = require('../controller/facture');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/facture/create',authenticateToken, ajouterFacture);
router.get('/facture/listall',authenticateToken, listallFacture);
router.post('/facture/detailById',authenticateToken, detailFacture);
router.post('/facture/delete',authenticateToken, deleteFacture);
router.post('/facture/update',authenticateToken, updateFacture);
router.get('/facture/user',authenticateToken, listUserFacture);

module.exports = router;