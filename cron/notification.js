const cron = require("node-cron");
const { connecter } = require("../bd/connect"); // Importer la connexion MySQL

// Fonction pour formater la date en YYYY-MM-DD (format MySQL)
const formatDateForMySQL = (d) => {
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0"); // Mois commence à 0
    const year = d.getFullYear();
    return `${year}-${month}-${day}`; // Format MySQL attendu
};

// Fonction pour vérifier et ajouter les notifications
const verifierNotifications = async () => {
    const date = new Date();
    console.log("🕛 Exécution de la vérification des notifications...");

    // Définir les dates de vérification
    const deuxMoisAvant = new Date();
    deuxMoisAvant.setMonth(deuxMoisAvant.getMonth() + 2);

    const unMoisAvant = new Date();
    unMoisAvant.setMonth(unMoisAvant.getMonth() + 1);

    const deuxSemainesAvant = new Date();
    deuxSemainesAvant.setDate(deuxSemainesAvant.getDate() + 14);

    try {
        connecter((error, connection) => {
            if (error) {
                console.error("❌ Erreur de connexion à la base de données :", error);
                return;
            }

            // Requête pour récupérer les produits qui expirent bientôt
            const sql = `
                SELECT id, nom, dateexpi FROM produit
                WHERE dateexpi IN (?, ?, ?)
            `;

            const dates = [
                formatDateForMySQL(deuxMoisAvant),
                formatDateForMySQL(unMoisAvant),
                formatDateForMySQL(deuxSemainesAvant),
            ];

            connection.query(sql, dates, (err, resultats) => {
                if (err) {
                    console.error("❌ Erreur lors de la récupération des produits :", err);
                    return;
                }

                if (resultats.length === 0) {
                    console.log("✅ Aucun produit n'expire bientôt.");
                    return;
                }

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
                                created_at: formatDateForMySQL(date),
                                updated_at: formatDateForMySQL(date),
                            };

                            connection.query('INSERT INTO notification SET ?', Notification, (erreur, result) => {
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
