const express = require('express');
const { subscribeNewsletter, sendContactForm, testEmailConfig } = require('../controller/contact-production');

const router = express.Router();

// Route pour l'abonnement newsletter
router.post('/newsletter/subscribe', subscribeNewsletter);

// Route pour le formulaire de contact
router.post('/send', sendContactForm);

// Route de test de configuration email (protégée en production)
router.get('/email/test-config', (req, res) => {
    // Vérifier si c'est un environnement de développement ou si un token admin est fourni
    const isDev = process.env.NODE_ENV !== 'production';
    const isAdmin = req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN}`;
    
    if (!isDev && !isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Accès non autorisé. Cette route est réservée au développement ou aux administrateurs.'
        });
    }
    
    testEmailConfig(req, res);
});

module.exports = router;