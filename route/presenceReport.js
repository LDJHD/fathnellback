const express = require('express');
const { generatePresenceReport } = require('../controller/presenceReport');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/generate-presence-report', authenticateToken, generatePresenceReport);

module.exports = router;
