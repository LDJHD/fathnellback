const express = require('express');
const {
    ajouterFacturation,
    listallFacturation,
    detailFacturation,
    deleteFacturation,
    updateFacturation,
    listUserFacturation,
    
} = require('../controller/facturation');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/facturation/create',authenticateToken, ajouterFacturation);
router.get('/facturation/listall',authenticateToken, listallFacturation);
router.post('facturation/detailById',authenticateToken, detailFacturation);
router.post('/facturation/delete',authenticateToken, deleteFacturation);
router.post('/facturation/update',authenticateToken, updateFacturation);
router.get('/facturation/user',authenticateToken, listUserFacturation);

module.exports = router;