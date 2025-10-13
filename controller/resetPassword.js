// RESTAPI/controller/resetPassword.js
const { connecter } = require('../bd/connect');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendResetCodeEmail, sendPasswordChangedEmail } = require('./emailService');

const requestResetPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ erreur: "Email requis" });

  // Générer un code à 6 chiffres
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = new Date();

  connecter((error, connection) => {
    if (error) {
      console.error("Erreur lors de la connexion à la base de données :", error);
      return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
    }
    // Récupérer nom/prenom pour personnaliser l'email
    connection.query('SELECT nom, prenom FROM users WHERE email = ?', [email], (err, userResults) => {
      if (err || userResults.length === 0) {
        return res.status(404).json({ erreur: "Utilisateur non trouvé pour cet email" });
      }
      const { nom, prenom } = userResults[0];
      connection.query(
        "INSERT INTO reset_password (email, code, created_at, updated_at) VALUES (?, ?, ?, ?)",
        [email, code, now, now],
        async (err, result) => {
          if (err) {
            console.error("Erreur lors de l'insertion du code de réinitialisation :", err);
            return res.status(500).json({ erreur: "Erreur serveur" });
          }
          // Envoi du code par email
          try {
            await sendResetCodeEmail(email, code, nom, prenom);
          } catch (e) {
            console.error("Erreur lors de l'envoi de l'email de code de réinitialisation :", e);
          }
          return res.json({ message: "Code envoyé" });
        }
      );
    });
  });
};

const verifyResetPassword = (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ erreur: "Email et code requis" });

  connecter((error, connection) => {
    if (error) {
      console.error("Erreur lors de la connexion à la base de données :", error);
      return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
    }
    connection.query(
      "SELECT * FROM reset_password WHERE email = ? AND code = ? AND created_at >= NOW() - INTERVAL 5 MINUTE",
      [email, code],
      (err, results) => {
        if (err) {
          console.error("Erreur lors de la vérification du code de réinitialisation :", err);
          return res.status(500).json({ erreur: "Erreur serveur" });
        }
        if (results.length > 0) {
          return res.json({ success: true, message: "Code correct" });
        } else {
          return res.status(400).json({ erreur: "Code incorrect ou expiré" });
        }
      }
    );
  });
};

const setNewPassword = (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) return res.status(400).json({ erreur: "Champs manquants" });

  connecter((error, connection) => {
    if (error) {
      console.error("Erreur lors de la connexion à la base de données :", error);
      return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
    }
    connection.query(
      "SELECT * FROM reset_password WHERE email = ? AND code = ? AND created_at >= NOW() - INTERVAL 5 MINUTE",
      [email, code],
      (err, results) => {
        if (err) {
          console.error("Erreur lors de la vérification du code de réinitialisation :", err);
          return res.status(500).json({ erreur: "Erreur serveur" });
        }
        if (results.length === 0) {
          return res.status(400).json({ erreur: "Code incorrect ou expiré" });
        }
        // Hash le nouveau mot de passe
        bcrypt.hash(password, 10, (err, hashedPassword) => {
          if (err) {
            console.error("Erreur lors du hash du mot de passe :", err);
            return res.status(500).json({ erreur: "Erreur serveur" });
          }
          // Récupérer nom/prenom pour personnaliser l'email
          connection.query('SELECT nom, prenom FROM users WHERE email = ?', [email], (err, userResults) => {
            const { nom, prenom } = (userResults && userResults[0]) || { nom: '', prenom: '' };
            connection.query(
              "UPDATE users SET password = ? WHERE email = ?",
              [hashedPassword, email],
              (err) => {
                if (err) {
                  console.error("Erreur lors de la mise à jour du mot de passe :", err);
                  return res.status(500).json({ erreur: "Erreur serveur ggg" });
                }
                connection.query(
                  "DELETE FROM reset_password WHERE email = ?",
                  [email],
                  async (err) => {
                    if (err) {
                      console.error("Erreur lors de la suppression du code de réinitialisation :", err);
                      return res.status(500).json({ erreur: "Erreur serveur" });
                    }
                    // Envoi de l'email de notification de changement de mot de passe
                    try {
                      await sendPasswordChangedEmail(email, nom, prenom);
                    } catch (e) {
                      console.error("Erreur lors de l'envoi de l'email de notification de changement de mot de passe :", e);
                    }
                    return res.json({ success: true, message: "Mot de passe mis à jour" });
                  }
                );
              }
            );
          });
        });
      }
    );
  });
};

module.exports = {
  requestResetPassword,
  verifyResetPassword,
  setNewPassword
};