// routes/Unit.js

const express = require('express');
const {
    ajouterUnit,
    listallUnit,
    detailUnit,
    deleteUnit,
    updateUnit,
    countUserUnit,
    countUnit
} = require('../controller/unit');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/unit/create',authenticateToken, ajouterUnit);
router.get('/unit/listall',authenticateToken, listallUnit);
router.post('/unit/detailById',authenticateToken, detailUnit);
router.post('/unit/delete',authenticateToken, deleteUnit);
router.post('/unit/update',authenticateToken, updateUnit);
router.post('/unit/countUserUnit',authenticateToken, countUserUnit);
router.get('/unit/countunit', countUnit);
module.exports = router;
