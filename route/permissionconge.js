const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const {
    // Permissions et congés
    createPermissionConge,
    getAllPermissionConge,
    getPermissionCongeById,
    updatePermissionConge,
    deletePermissionConge,
    
    // Types de congés
    getAllTypeConge,
    createTypeConge,
    updateTypeConge,
    deleteTypeConge,
    
    // Types de permissions
    getAllTypePermission,
    createTypePermission,
    updateTypePermission,
    deleteTypePermission,
    
    // Nouvelles fonctions de validation
    validerDemande,
    getTempsRestant
} = require('../controller/permissionconge');

// Routes pour les permissions et congés
router.post('/permission-conge', authenticateToken, createPermissionConge);
router.get('/permission-conge', authenticateToken, getAllPermissionConge);
router.get('/permission-conge/:id', authenticateToken, getPermissionCongeById);
router.patch('/permission-conge/:id', authenticateToken, updatePermissionConge);
router.delete('/permission-conge/:id', authenticateToken, deletePermissionConge);

// Nouvelles routes pour la validation et le suivi
router.patch('/permission-conge/:id/valider', authenticateToken, validerDemande);
router.get('/permission-conge/:id/temps-restant', authenticateToken, getTempsRestant);

// Routes pour les types de congé
router.get('/type-conge', authenticateToken, getAllTypeConge);
router.post('/type-conge', authenticateToken, createTypeConge);
router.patch('/type-conge/:id', authenticateToken, updateTypeConge);
router.delete('/type-conge/:id', authenticateToken, deleteTypeConge);

// Routes pour les types de permission
router.get('/type-permission', authenticateToken, getAllTypePermission);
router.post('/type-permission', authenticateToken, createTypePermission);
router.patch('/type-permission/:id', authenticateToken, updateTypePermission);
router.delete('/type-permission/:id', authenticateToken, deleteTypePermission);

module.exports = router;
