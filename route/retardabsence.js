const express = require('express');
const { getDailyRetardsAbsences } = require('../controller/retardabsence');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.get('/retards-absences', authenticateToken, getDailyRetardsAbsences);

module.exports = router;


