const express = require('express');
const {
    ajouterBanniere,
    listAllBannieres,
    listBannieresActives,
    supprimerBanniere,
    toggleBanniere
} = require('../controller/banniere');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Routes pour la gestion des bannières
router.post('/banniere/create', authenticateToken, ajouterBanniere);
router.get('/banniere/listall', authenticateToken, listAllBannieres);
router.get('/banniere/actives', listBannieresActives); // Route publique pour le site
router.post('/banniere/delete', authenticateToken, supprimerBanniere);
router.post('/banniere/toggle', authenticateToken, toggleBanniere);

module.exports = router;