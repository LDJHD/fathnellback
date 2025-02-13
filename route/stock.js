// routes/stock.js

const express = require('express');
const {
    ajouterStock,
    listallStock,
    detailStock,
    deleteStock,
    updateStock,
    valeurStock
} = require('../controller/stock');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/stock/create',authenticateToken, ajouterStock);
router.get('/stock/listall',authenticateToken, listallStock);
router.post('/stock/detailById',authenticateToken, detailStock);
router.post('/stock/delete',authenticateToken,deleteStock);
router.post('/stock/update',authenticateToken, updateStock);
router.post('/stock/valeur',authenticateToken, valeurStock);
module.exports = router;
