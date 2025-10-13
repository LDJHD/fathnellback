const express = require('express');
const {
  createPlanning,
  getAllPlannings,
  getPlanningById,
  updatePlanning,
  deletePlanning
} = require('../controller/planning');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Routes pour le planning avec authentification
router.post('/planning/create', authenticateToken, createPlanning);
router.get('/planning/all', authenticateToken, getAllPlannings);
router.get('/planning/:id', authenticateToken, getPlanningById);
router.put('/planning/update/:id', authenticateToken, updatePlanning);
router.delete('/planning/delete/:id', authenticateToken, deletePlanning);

module.exports = router; 