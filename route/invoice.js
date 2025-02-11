// routes/invoice.js
const path = require('path');
const express = require('express');
const {
  postInvoiceRequestDto,
  getInvoiceDetailsDto,
  generateInvoicePDF,
  putFinalize,
  createInvoice,
  statistiqueComptabilitePdf
} = require('../controller/invoice');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/invoice/create',authenticateToken, postInvoiceRequestDto);
router.get('/invoice/listall',authenticateToken, getInvoiceDetailsDto);
router.post('/invoice/detailById',authenticateToken, generateInvoicePDF);
router.put('/invoice/delete',authenticateToken, putFinalize);
router.post('/invoice/createfff',authenticateToken, createInvoice);
router.post('/invoice/statistique',authenticateToken, statistiqueComptabilitePdf);

router.use('/factures', express.static(path.join(__dirname, '../factures')));
router.use('/pdf', express.static(path.join(__dirname, '../pdf')));

module.exports = router;
