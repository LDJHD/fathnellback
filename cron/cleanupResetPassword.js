const { connecter } = require('../bd/connect');

const cleanupResetPassword = async () => {
  try {
    connecter((err, pool) => {
      if (err) {
        console.error("Erreur de connexion à la base de données :", err);
        return;
      }
      pool.query(
        "DELETE FROM reset_password WHERE created_at < NOW() - INTERVAL 5 MINUTE",
        (err, results) => {
          if (err) {
            console.error("Erreur lors du nettoyage des codes expirés :", err);
          } else {
            console.log("Codes expirés supprimés");
          }
        }
      );
    });
  } catch (err) {
    console.error("Erreur lors du nettoyage des codes expirés :", err);
  }
};

module.exports = cleanupResetPassword;