const { connecter } = require("./bd/connect");

const ajouterFacturation = async (req, res) => {
    try {
        const date=new Date();
        const facturation = {
            facture_id: req.body.facture_id,
            pdf: req.body.pdf,
            created_at:date,
            updated_at:date
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO facturation SET ?', facturation, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de l'facturation :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de facturation" });
                } else {
                    console.log("facturation ajouté avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}


const listallFacturation = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM facturation', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des facturations :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des catégories" });
                } else {
                    return res.status(200).json(results);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


const listUserFacturation = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const userid=req.user.id;

            connection.query('SELECT * FROM facturation ', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des facturations de l'user :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des catégories" });
                } else {
                    return res.status(200).json(results);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const updateFacturation = async (req, res) => {
    try {
        const { id,message } = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const facturation = {
            facture_id,
            pdf,
            updated_at: date,
        };
        
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE facturation SET ? WHERE id = ? ';
            connection.query(updateQuery, [facturation, id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de facturation :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de facturation" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("facturation mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const detailFacturation = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM facturation WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la catégorie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la catégorie" });
                } else {
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const deleteFacturation = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM facturation WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la catégorie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la catégorie" });
                } else {
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


module.exports = {
    ajouterFacturation,
    listallFacturation,
    detailFacturation,
    deleteFacturation,
    listUserFacturation,
    updateFacturation
 };
