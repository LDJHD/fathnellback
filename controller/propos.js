const { connecter } = require("./bd/connect");

const ajouterPropos = async (req, res) => {
    try {
        const propos = {
            contenus: req.body.contenus,
            user_id: req.body.user_id,
            created_at: req.body.created_at,
            updated_at: req.body.updated_at,
        };

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('INSERT INTO propos SET ?', propos, (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de l'ajout de l'Propos :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de l'ajout de Propos" });
                } else {
                    console.log("Propos ajouté avec succès.");
                    return res.status(200).json(result);
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
}


const listallPropos = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM Propos', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des catégories :", erreur);
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


const listUserPropos = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const userid=req.user.id;

            connection.query('SELECT * FROM Propos WHERE user_id = ?',[userid], (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des Proposs de l'user :", erreur);
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

const updatePropos = async (req, res) => {
    try {
        const { id,contenus } = req.body;
        const date = new Date;

        if (!id) {
            return res.status(400).json({ erreur: "L'ID est requis pour la mise à jour" });
        }

        const Propos = {
            contenus,
            updated_at: date,
        };
        const userid = req.user.id;
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            const updateQuery = 'UPDATE Propos SET ? WHERE id = ? and user_id=?';
            connection.query(updateQuery, [Propos, id,userid], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la mise à jour de Propos :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la mise à jour de Propos" });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                    }
                    console.log("Propos mis à jour avec succès.");
                    return res.status(200).json({ message: "Mise à jour réussie", result });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};

const detailPropos = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM Propos WHERE id = ?', [id], (erreur, result) => {
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

const deletePropos = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('DELETE FROM Propos WHERE id = ?', [id], (erreur, result) => {
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

const countUserPropos = async (req, res) => {
    try {
        const userid = req.user.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT COUNT(*) AS count FROM Propos WHERE user_id = ?', [userid], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors du compte de Propos :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors du compte de Propos :" });
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


const ajouterProposSiPossible = async (req, res) => {
    try {
        const userid = req.user.id;
        const date=new Date();

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Vérifier le nombre de propos pour l'utilisateur
            connection.query('SELECT COUNT(*) AS count FROM Propos WHERE user_id = ?', [userid], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors du compte de Propos :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors du compte de Propos" });
                } else {
                    const count = result[0].count;
                    if (count !== 0) {
                        return res.status(400).json({ erreur: "La création de Propos n'est pas possible car il existe déjà des Propos pour cet utilisateur." });
                    }

                    // Si count est 0, ajouter un nouveau propos
                    const propos = {
                        contenus: req.body.contenus,
                        user_id: userid,
                        created_at: date,
                        updated_at: date,
                    };

                    connection.query('INSERT INTO propos SET ?', propos, (erreur, result) => {
                        if (erreur) {
                            console.error("Erreur lors de l'ajout de Propos :", erreur);
                            return res.status(500).json({ erreur: "Erreur lors de l'ajout de Propos" });
                        } else {
                            console.log("Propos ajouté avec succès.");
                            return res.status(200).json(result);
                        }
                    });
                }
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


module.exports = { ajouterPropos,
    listallPropos,
    detailPropos,
    deletePropos,
    listUserPropos,
    updatePropos,
    countUserPropos,
    ajouterProposSiPossible
 };
