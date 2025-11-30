const express = require('express');
const {
    ajouterCollection,
    listallCollections,
    detailCollection,
    updateCollection,
    deleteCollection
} = require('../controller/collection');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.post('/collection/create',authenticateToken, ajouterCollection);
router.get('/collection/listall', listallCollections);
router.post('/collection/detailById', detailCollection);
router.post('/collection/update',authenticateToken,  updateCollection);
router.post('/collection/delete', deleteCollection);
// router.post('/collection/delete', authenticateToken, deleteCollection);

module.exports = router;
