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

// Template pour l'email de bienvenue
const getWelcomeEmailTemplate = (nom, prenom) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🎉 Bienvenue sur fatnelle !</h1>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
            Bonjour <strong>${prenom} ${nom}</strong>,
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
            Nous sommes ravis de vous accueillir sur <strong>fatnelle</strong>, votre plateforme de gestion complète pour votre entreprise.
          </p>
        </div>
        
        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #2c3e50; margin-top: 0;">🚀 Ce que vous pouvez faire avec fatnelle :</h3>
          <ul style="color: #34495e; line-height: 1.8;">
            <li>Gérer vos produits et stocks</li>
            <li>Effectuer des ventes et générer des factures</li>
            <li>Suivre vos clients et fournisseurs</li>
            <li>Analyser vos statistiques de vente</li>
            <li>Gérer vos utilisateurs et permissions</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
             style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Commencer à utiliser fatnelle
          </a>
        </div>
        
        <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
          <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin: 0;">
            Si vous avez des questions, n'hésitez pas à nous contacter.<br>
            L'équipe fatnelle
          </p>
        </div>
      </div>
    </div>
  `;
};

// Template pour l'email de code de réinitialisation
const getResetCodeEmailTemplate = (code, nom, prenom) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">🔐 Réinitialisation de mot de passe</h1>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
            Bonjour <strong>${prenom} ${nom}</strong>,
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
            Vous avez demandé la réinitialisation de votre mot de passe sur fatnelle.
          </p>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
          <h3 style="color: #856404; margin-top: 0;">Votre code de réinitialisation :</h3>
          <div style="background-color: #f8f9fa; border: 2px dashed #dee2e6; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #495057; letter-spacing: 3px;">${code}</span>
          </div>
          <p style="color: #856404; font-size: 14px; margin: 10px 0 0 0;">
            Ce code expire dans 5 minutes.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <p style="color: #6c757d; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>⚠️ Important :</strong> Si vous n'avez pas demandé cette réinitialisation, 
            ignorez cet email. Votre mot de passe restera inchangé.
          </p>
        </div>
        
        <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
          <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin: 0;">
            L'équipe fatnelle<br>
            Sécurité et support
          </p>
        </div>
      </div>
    </div>
  `;
};

// Template pour l'email de confirmation de changement de mot de passe
const getPasswordChangedEmailTemplate = (nom, prenom) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #27ae60; margin: 0; font-size: 28px;">✅ Mot de passe mis à jour</h1>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
            Bonjour <strong>${prenom} ${nom}</strong>,
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
            Votre mot de passe sur fatnelle a été modifié avec succès.
          </p>
        </div>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #155724; margin-top: 0;">🔒 Sécurité confirmée</h3>
          <p style="color: #155724; margin: 0; line-height: 1.6;">
            Votre compte est maintenant sécurisé avec votre nouveau mot de passe. 
            Vous pouvez vous connecter normalement à votre compte fatnelle.
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
             style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Se connecter à fatnelle
          </a>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <p style="color: #6c757d; font-size: 14px; margin: 0; line-height: 1.5;">
            <strong>💡 Conseil de sécurité :</strong> Utilisez un mot de passe unique et fort 
            pour protéger votre compte. Ne partagez jamais vos identifiants.
          </p>
        </div>
        
        <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
          <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin: 0;">
            L'équipe fatnelle<br>
            Sécurité et support
          </p>
        </div>
      </div>
    </div>
  `;
};

// Fonction pour envoyer un email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"fatnelle" <${process.env.GMAIL_USER || 'contacttoconnect01@gmail.com'}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès à:', to);
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

// Fonction pour envoyer l'email de bienvenue
const sendWelcomeEmail = async (email, nom, prenom) => {
  const subject = '🎉 Bienvenue sur fatnelle !';
  const html = getWelcomeEmailTemplate(nom, prenom);
  return await sendEmail(email, subject, html);
};

// Fonction pour envoyer l'email de code de réinitialisation
const sendResetCodeEmail = async (email, code, nom, prenom) => {
  const subject = '🔐 Code de réinitialisation - fatnelle';
  const html = getResetCodeEmailTemplate(code, nom, prenom);
  return await sendEmail(email, subject, html);
};

// Fonction pour envoyer l'email de confirmation de changement de mot de passe
const sendPasswordChangedEmail = async (email, nom, prenom) => {
  const subject = '✅ Mot de passe mis à jour - fatnelle';
  const html = getPasswordChangedEmailTemplate(nom, prenom);
  return await sendEmail(email, subject, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendResetCodeEmail,
  sendPasswordChangedEmail
}; 