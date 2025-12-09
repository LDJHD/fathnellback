const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Configuration flexible pour production
const USE_SENDGRID = process.env.NODE_ENV === 'production' && process.env.SENDGRID_API_KEY;

// Configuration SendGrid pour production
if (USE_SENDGRID) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configuration Gmail pour développement
const createGmailTransporter = () => {
  try {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      // Options supplémentaires pour production
      pool: true,
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });
  } catch (error) {
    console.error('❌ Erreur configuration Gmail:', error);
    return null;
  }
};

// Email de destination
const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL || 'fathnell2020@gmail.com';

// Fonction d'envoi avec fallback
const sendEmailWithFallback = async (mailOptions) => {
  // Tentative 1: SendGrid en production
  if (USE_SENDGRID) {
    try {
      const sendGridMsg = {
        to: DESTINATION_EMAIL,
        from: process.env.SENDGRID_EMAIL || process.env.GMAIL_USER,
        subject: mailOptions.subject,
        html: mailOptions.html
      };
      
      await sgMail.send(sendGridMsg);
      console.log('✅ Email envoyé via SendGrid');
      return { success: true, method: 'SendGrid' };
    } catch (error) {
      console.error('❌ Échec SendGrid, tentative Gmail:', error.response?.body || error.message);
      // Continuer avec Gmail en cas d'échec SendGrid
    }
  }

  // Tentative 2: Gmail
  const transporter = createGmailTransporter();
  if (!transporter) {
    throw new Error('Impossible de créer le transporteur Gmail');
  }

  try {
    // Vérifier la configuration avant l'envoi
    await transporter.verify();
    console.log('✅ Configuration Gmail vérifiée');
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé via Gmail, ID:', info.messageId);
    return { success: true, method: 'Gmail', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Échec Gmail:', error);
    throw error;
  }
};

// Newsletter subscription
const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'L\'adresse email est requise' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adresse email invalide' 
      });
    }

    // Préparer l'email
    const mailOptions = {
      from: `"FathNell Newsletter" <${process.env.GMAIL_USER || process.env.SENDGRID_EMAIL}>`,
      to: DESTINATION_EMAIL,
      subject: '📧 Nouvelle inscription Newsletter - FathNell',
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📧 Nouvelle Inscription Newsletter</h1>
          </div>
          
          <div style="background-color: white; padding: 40px; border-left: 4px solid #667eea;">
            <h2 style="color: #333; margin-top: 0;">Nouvelle inscription sur FathNell !</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; color: #555;">
                <strong>Email :</strong> ${email}
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                <strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}
              </p>
            </div>

            <div style="margin: 30px 0; padding: 20px; background-color: #e8f4fd; border-radius: 8px;">
              <p style="margin: 0; color: #1a73e8; font-weight: bold;">
                💡 Action recommandée :
              </p>
              <p style="margin: 10px 0 0 0; color: #666;">
                Ajoutez cette adresse à votre liste de diffusion newsletter.
              </p>
            </div>
          </div>
          
          <div style="background-color: #667eea; padding: 20px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 14px;">
              FathNell - Maroquinerie de luxe<br>
              Système de notification automatique
            </p>
          </div>
        </div>
      `
    };

    // Envoyer l'email
    const result = await sendEmailWithFallback(mailOptions);
    
    console.log(`✅ Email de newsletter envoyé via ${result.method} pour:`, email);

    return res.status(200).json({
      success: true,
      message: 'Votre inscription à la newsletter a été confirmée !',
      method: result.method
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de newsletter:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription. Veuillez réessayer plus tard.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Contact form
const sendContactForm = async (req, res) => {
  try {
    const { email, objet, message } = req.body;

    // Validation
    if (!email || !objet || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tous les champs sont requis (email, objet, message)' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adresse email invalide' 
      });
    }

    // Préparer l'email
    const mailOptions = {
      from: `"FathNell Contact" <${process.env.GMAIL_USER || process.env.SENDGRID_EMAIL}>`,
      to: DESTINATION_EMAIL,
      subject: `💬 Nouveau message de contact - ${objet}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💬 Nouveau Message de Contact</h1>
          </div>
          
          <div style="background-color: white; padding: 40px; border-left: 4px solid #667eea;">
            <h2 style="color: #333; margin-top: 0;">${objet}</h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; color: #555;">
                <strong>Email :</strong> <a href="mailto:${email}" style="color: #3498db;">${email}</a>
              </p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                <strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}
              </p>
            </div>

            <div style="background-color: #fff; padding: 25px; border: 1px solid #e9ecef; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #495057; margin-top: 0; font-size: 18px;">Message :</h3>
              <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #6c757d; font-style: italic; line-height: 1.6; color: #495057;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="mailto:${email}" 
                 style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Répondre à ${email}
              </a>
            </div>
          </div>
          
          <div style="background-color: #667eea; padding: 20px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 14px;">
              FathNell - Maroquinerie de luxe<br>
              Système de notification automatique
            </p>
          </div>
        </div>
      `
    };

    // Envoyer l'email
    const result = await sendEmailWithFallback(mailOptions);
    
    console.log(`✅ Email de contact envoyé via ${result.method} depuis:`, email);

    return res.status(200).json({
      success: true,
      message: 'Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.',
      method: result.method
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de contact:', error);
    
    // Log détaillé pour debug en production
    if (error.code) {
      console.error('Code erreur:', error.code);
    }
    if (error.response) {
      console.error('Réponse serveur:', error.response);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Test de configuration email
const testEmailConfig = async (req, res) => {
  try {
    const config = {
      environment: process.env.NODE_ENV || 'development',
      gmail_configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      sendgrid_configured: !!process.env.SENDGRID_API_KEY,
      destination_email: DESTINATION_EMAIL,
      using_sendgrid: USE_SENDGRID
    };

    // Test rapide de connection Gmail si configuré
    if (config.gmail_configured) {
      try {
        const transporter = createGmailTransporter();
        await transporter?.verify();
        config.gmail_connection = 'OK';
      } catch (error) {
        config.gmail_connection = `Erreur: ${error.message}`;
      }
    }

    res.json({
      success: true,
      config,
      recommendations: [
        config.gmail_configured ? '✅ Gmail configuré' : '❌ Variables Gmail manquantes',
        config.sendgrid_configured ? '✅ SendGrid configuré' : '❌ SendGrid non configuré',
        USE_SENDGRID ? '📧 Utilise SendGrid en production' : '📧 Utilise Gmail'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  subscribeNewsletter,
  sendContactForm,
  testEmailConfig
};