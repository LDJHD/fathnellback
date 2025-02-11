const express = require('express');
const {
    ajouterClient,
    listallClient,
    detailClient,
    deleteClient,
    updateClient,
    listUserClient,
    getClientCount,
    
} = require('../controller/client');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/client/create',authenticateToken, ajouterClient);
router.get('/client/listall',authenticateToken, listallClient);
router.post('/client/detailById',authenticateToken, detailClient);
router.post('/client/delete',authenticateToken, deleteClient);
router.post('/client/update',authenticateToken, updateClient);
router.get('/client/user',authenticateToken, listUserClient);
router.get('/client/count',authenticateToken, getClientCount);

module.exports = router;