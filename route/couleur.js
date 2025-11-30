const express = require('express');
const {
    listallCouleurs,
    ajouterCouleur,
    deleteCouleur
} = require('../controller/couleur');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Route publique pour lister les couleurs
router.get('/couleur/listall', listallCouleurs);

// Routes admin
router.post('/couleur/create', authenticateToken, ajouterCouleur);
router.post('/couleur/delete', authenticateToken, deleteCouleur);

module.exports = router;
