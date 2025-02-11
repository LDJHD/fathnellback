// routes/pdfRoutes.js

const express = require('express');
const { generatePDFController } = require('../controller/pdfController');

const router = express.Router();

// Route pour générer et télécharger un PDF
router.get('/generate-pdf', generatePDFController);

module.exports = router;
