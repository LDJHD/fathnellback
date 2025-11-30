const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'contacttoconnect01@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'twohjvzdnypydige'
  }
});

// Email de destination
const DESTINATION_EMAIL = 'fathnell2020@gmail.com';

// Envoyer un email pour l'abonnement à la newsletter
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'L\'adresse email est requise' 
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adresse email invalide' 
      });
    }

    // Préparer l'email
    const mailOptions = {
      from: `"FathNell Newsletter" <${process.env.GMAIL_USER || 'contacttoconnect01@gmail.com'}>`,
      to: DESTINATION_EMAIL,
      subject: '📧 Nouvel abonnement à la newsletter FathNell',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">📧 Nouvel abonnement</h1>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
                Une nouvelle personne s'est abonnée à la newsletter FathNell.
              </p>
            </div>
            
            <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #2c3e50; margin-top: 0;">📬 Informations de l'abonné :</h3>
              <p style="color: #34495e; font-size: 16px; line-height: 1.8; margin: 5px 0;">
                <strong>Email :</strong> ${email}
              </p>
              <p style="color: #34495e; font-size: 14px; line-height: 1.8; margin: 5px 0;">
                <strong>Date :</strong> ${new Date().toLocaleString('fr-FR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            
            <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
              <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin: 0;">
                FathNell - Maroquinerie de luxe<br>
                Système de notification automatique
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de newsletter envoyé pour:', email);

    return res.status(200).json({
      success: true,
      message: 'Abonnement à la newsletter réussi !'
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de newsletter:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.'
    });
  }
};

// Envoyer un email pour le formulaire de contact
const sendContactForm = async (req, res) => {
  try {
    const { email, objet, message } = req.body;

    // Validation des champs
    if (!email || !objet || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont requis (email, objet, message)' 
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adresse email invalide' 
      });
    }

    // Préparer l'email
    const mailOptions = {
      from: `"FathNell Contact" <${process.env.GMAIL_USER || 'contacttoconnect01@gmail.com'}>`,
      to: DESTINATION_EMAIL,
      subject: `📨 Contact FathNell: ${objet}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">📨 Nouveau message de contact</h1>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
                Vous avez reçu un nouveau message via le formulaire de contact FathNell.
              </p>
            </div>
            
            <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #2c3e50; margin-top: 0;">📋 Informations du contact :</h3>
              <p style="color: #34495e; font-size: 16px; line-height: 1.8; margin: 10px 0;">
                <strong>Email :</strong> <a href="mailto:${email}" style="color: #3498db;">${email}</a>
              </p>
              <p style="color: #34495e; font-size: 16px; line-height: 1.8; margin: 10px 0;">
                <strong>Objet :</strong> ${objet}
              </p>
              <p style="color: #34495e; font-size: 14px; line-height: 1.8; margin: 10px 0;">
                <strong>Date :</strong> ${new Date().toLocaleString('fr-FR', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #3498db;">
              <h3 style="color: #2c3e50; margin-top: 0;">💬 Message :</h3>
              <p style="color: #34495e; font-size: 16px; line-height: 1.8; margin: 0; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="mailto:${email}" 
                 style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Répondre à ${email}
              </a>
            </div>
            
            <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
              <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin: 0;">
                FathNell - Maroquinerie de luxe<br>
                Système de notification automatique
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de contact envoyé depuis:', email);

    return res.status(200).json({
      success: true,
      message: 'Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.'
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.'
    });
  }
};

module.exports = {
  subscribeNewsletter,
  sendContactForm
};

