const express = require('express');
const {
    ajouterCompany,
    listallCompany,
    detailCompany,
    updateCompany,
    deleteCompany,
    countCompany
} = require('../controller/company');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/company/create', authenticateToken, ajouterCompany);
router.get('/company/listall', authenticateToken, listallCompany);
router.post('/company/detailById', authenticateToken, detailCompany);
router.post('/company/delete', authenticateToken, deleteCompany);
router.post('/company/update', authenticateToken, updateCompany);
router.get('/company/countCompany', countCompany);

module.exports = router; 