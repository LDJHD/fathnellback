const express = require('express');
const { subscribeNewsletter, sendContactForm } = require('../controller/contact');

const router = express.Router();

// Route pour l'abonnement à la newsletter
router.post('/newsletter/subscribe', subscribeNewsletter);

// Route pour le formulaire de contact
router.post('/send', sendContactForm);

module.exports = router;

