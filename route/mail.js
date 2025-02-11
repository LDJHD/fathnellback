// routes/mail.js

const express = require('express');
const {
    envoyerEmail,
} = require('../controller/mailer');

const router = express.Router();

const authenticateToken = require('../middleware/auth');
router.post('/mail',envoyerEmail);

module.exports = router;
