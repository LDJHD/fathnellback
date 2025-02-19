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
const verifierNotificationsstock = async () => {
    const date = new Date();
    console.log("🕛 Exécution de la vérification des notifications de stock...");

    try {
        connecter((error, connection) => {
            if (error) {
                console.error("❌ Erreur de connexion à la base de données :", error);
                return;
            }

            // Récupérer tous les produits avec leur stock actuel
            connection.query(
                'SELECT produit_id, quantite_stock  FROM stock',
                (err, resultatsStock) => {
                    if (err) {
                        console.error("❌ Erreur lors de la récupération des stocks :", err);
                        return;
                    }

                    if (resultatsStock.length === 0) {
                        console.log("✅ Aucun produit trouvé.");
                        return;
                    }

                    resultatsStock.forEach((produit) => {
                        const { produit_id, nom } = produit;

                        // Requête pour récupérer le stock restant pour chaque produit
                        connection.query(
                            'SELECT quantite_stock FROM stock WHERE produit_id = ?',
                            [produit_id],
                            (err, resultStock) => {
                                if (err) {
                                    console.error("❌ Erreur lors de la récupération du stock restant :", err);
                                    return;
                                }

                                if (resultStock.length === 0) {
                                    console.log(`✅ Aucun stock trouvé pour le produit ${nom}.`);
                                    return;
                                }

                                const quantiteStock = resultStock[0].quantite_stock;

                                // Vérifier si le stock est inférieur à 20
                                if (quantiteStock < 20) {
                                    const message = `Votre stock restant pour ${nom} est de ${quantiteStock}. Veuillez vite recharger.`;
                                    const type = "stock faible";

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
                                                    console.log(`✅ Notification ajoutée pour ${nom} : ${message}`);
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        );
                    });
                }
            );

        });
    } catch (error) {
        console.error("❌ Erreur serveur :", error);
    }
};

// Exécuter la tâche tous les jours à minuit
cron.schedule("0 0 * * *", () => {
    verifierNotificationsstock();
});

module.exports = verifierNotificationsstock;
