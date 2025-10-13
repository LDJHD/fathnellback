const express = require('express');
const { getPonctualiteReport } = require('../controller/ponctualite');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.get('/ponctualite', authenticateToken, getPonctualiteReport);

module.exports = router;
