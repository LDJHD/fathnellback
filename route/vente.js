const express = require('express');
const {
    ajouterVente,
    listallVentes,
    detailVente,
    updateVente,
    deleteVente,
    statsVentes,
    // Aliases pour compatibilité
    listall,
    detail,
    update,
    ajouter,
    supprimer
} = require('../controller/vente');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Routes principales (nouvelles)
router.post('/vente/create', authenticateToken, ajouterVente);
router.get('/vente/listall', authenticateToken, listallVentes);
router.post('/vente/detailById', authenticateToken, detailVente);
router.post('/vente/update', authenticateToken, updateVente);
router.post('/vente/delete', authenticateToken, deleteVente);
router.get('/vente/stats', authenticateToken, statsVentes);

// Routes publiques pour création de commandes depuis le frontend
router.post('/vente/commande/create', ajouterVente);

// Aliases pour compatibilité avec l'ancien système
router.post('/vente/ajouter', authenticateToken, ajouter);
router.get('/vente/listall', authenticateToken, listall);
router.post('/vente/detail', authenticateToken, detail);
router.post('/vente/modifier', authenticateToken, update);
router.post('/vente/supprimer', authenticateToken, supprimer);
module.exports = router;