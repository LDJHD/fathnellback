const express = require('express');
const {
    ajouterdetailCommande,
    listalldetailCommande,
    detaildetailCommande,
    deletedetailCommande,
    updatedetailCommande,
    listUserdetailCommande,
    
} = require('../controller/detailcommande');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/detailcommande/create',authenticateToken, ajouterdetailCommande);
router.get('/detailcommande/listall',authenticateToken, listalldetailCommande);
router.post('/detailcommande/detailById',authenticateToken, detaildetailCommande);
router.post('/detailcommande/delete',authenticateToken, deletedetailCommande);
router.post('/detailcommande/update',authenticateToken, updatedetailCommande);
router.get('/detailcommande/user',authenticateToken, listUserdetailCommande);

module.exports = router;