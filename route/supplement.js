const express = require('express');
const {
    ajoutersupplement,
    listallsupplement,
    detailsupplement,
    deletesupplement,
    updatesupplement,
    detailsupplementbyproduit
    
} = require('../controller/supplement');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/supplement/create',authenticateToken, ajoutersupplement);
router.get('/supplement/listall',authenticateToken, listallsupplement);
router.post('/supplement/detailById',authenticateToken, detailsupplement);
router.post('/supplement/delete',authenticateToken, deletesupplement);
router.post('/supplement/update',authenticateToken, updatesupplement);
router.post('/supplement/detailbyproduit',authenticateToken, detailsupplementbyproduit);

module.exports = router;