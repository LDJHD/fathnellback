const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controller/dashboard');
const authenticateToken = require('../middleware/auth');

// Route pour récupérer les statistiques du dashboard
router.get('/dashboard/stats', authenticateToken, getDashboardStats);

module.exports = router;
