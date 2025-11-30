const express = require('express');
const {
    listallTailles,
    ajouterTaille,
    deleteTaille
} = require('../controller/taille');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Route publique pour lister les tailles
router.get('/taille/listall', listallTailles);

// Routes admin
router.post('/taille/create', authenticateToken, ajouterTaille);
router.post('/taille/delete', authenticateToken, deleteTaille);

module.exports = router;
