require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Configuration de SendGrid avec la clé API
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Fonction pour envoyer un email
const envoyerEmail = (to, subject, body) => {
    const msg = {
        to,
        from: process.env.SENDGRID_EMAIL, // Votre email vérifié sur SendGrid
        subject,
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="background-color: #f2f2f2; padding: 10px; text-align: center;">${subject}</h2>
            <div style="padding: 20px;">
                <p>Bonjour,</p>
                <p>${body}</p>
                <p>Cordialement,</p>
                <p><strong>Votre Nom</strong></p>
            </div>
            <footer style="background-color: #f2f2f2; padding: 10px; text-align: center;">
                <p>Mon Entreprise - Adresse - Contact</p>
            </footer>
        </div>
        `
    };

    sgMail.send(msg)
        .then(() => {
            console.log('Email envoyé avec succès');
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi de l\'email:', error.response.body.errors);
        });
};

module.exports = { envoyerEmail };
