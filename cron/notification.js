const cron = require("node-cron");
const { connecter } = require("../bd/connect"); // Connexion MySQL

// Fonction pour formater une date en YYYY-MM-DD HH:MM:SS (format MySQL)
const formatDateForMySQL = (d) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Fonction pour vérifier et ajouter les notifications
const verifierNotifications = async () => {
    console.log("🕛 Exécution de la vérification des notifications...");

    // Définir les dates de vérification
    const maintenant = new Date();
    const deuxMoisAvant = new Date();
    deuxMoisAvant.setMonth(deuxMoisAvant.getMonth() + 2);

    console.log("🔍 Recherche des produits expirant entre :", formatDateForMySQL(maintenant), "et", formatDateForMySQL(deuxMoisAvant));

    try {
        connecter((error, connection) => {
            if (error) {
                console.error("❌ Erreur de connexion à la base de données :", error);
                return;
            }

            // Requête SQL pour trouver les produits dont la date d'expiration est dans la plage
            const sql = `
                SELECT id, nom, dateexpi
                FROM produit
                WHERE dateexpi BETWEEN ? AND ?
            `;

            connection.query(sql, [formatDateForMySQL(maintenant), formatDateForMySQL(deuxMoisAvant)], (err, resultats) => {
                if (err) {
                    console.error("❌ Erreur lors de la récupération des produits :", err);
                    return;
                }

                if (resultats.length === 0) {
                    console.log("✅ Aucun produit n'expire bientôt.");
                    return;
                }

                console.log("📋 Produits trouvés :", resultats);

                resultats.forEach((produit) => {
                    const message = `${produit.nom} expire le (${produit.dateexpi}).`;
                    const type = "expiration";

                    // Vérifier si la notification existe déjà
                    const checkQuery = `SELECT id FROM notification WHERE message = ?`;
                    connection.query(checkQuery, [message], (err, rows) => {
                        if (err) {
                            console.error("❌ Erreur lors de la vérification des notifications :", err);
                            return;
                        }

                        if (rows.length === 0) {
                            // Insérer la notification
                            const Notification = {
                                message,
                                type,
                                lu: 0,
                                created_at: formatDateForMySQL(new Date()),
                                updated_at: formatDateForMySQL(new Date()),
                            };

                            connection.query('INSERT INTO notification SET ?', Notification, (erreur) => {
                                if (erreur) {
                                    console.error("❌ Erreur lors de l'ajout de la notification :", erreur);
                                } else {
                                    console.log("✅ Notification ajoutée :", message);
                                }
                            });
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error("❌ Erreur serveur :", error);
    }
};

// Exécuter la tâche tous les jours à minuit
cron.schedule("0 0 * * *", () => {
    verifierNotifications();
});

module.exports = verifierNotifications;
