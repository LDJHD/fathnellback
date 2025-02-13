const fs = require('fs');
const path = require('path');
const { connecter } = require("./bd/connect");


const ajouterProduit = async (req, res) => {
    try {
        const date = new Date();
        const files = req.files; // Pour gérer plusieurs fichiers
        const nbrimage = req.body.nbrimage;

        const produits = files.map(file => {
            const extension = path.extname(file.originalname).slice(1); // Extraire l'extension du fichier
            return {
                nom: req.body.nom,
                description: req.body.description,
                fichier: file.filename, // Nom du fichier uploadé
                categorie_id: req.body.categorie_id,
                type_id: req.body.type_id,
                user_id: req.user.id, // Utiliser l'ID de l'utilisateur connecté
                created_at: date,
                updated_at: date,
                extension: extension,
                avant: 0,
                nbrimage: nbrimage,
            };
        });

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            if (nbrimage === 'un') {
                // Concaténer les noms de fichiers pour un enregistrement unique
                const uniqueProduit = { ...produits[0] };
                uniqueProduit.fichier = produits.map(p => p.fichier).join(',');
                
                connection.query('INSERT INTO produit SET ?', uniqueProduit, (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de l'ajout de Produit :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de l'ajout de Produit" });
                    } else {
                        console.log("Produit ajouté avec succès.");
                        return res.status(200).json(result);
                    }
                });
            } else {
                // Insérer chaque fichier comme une nouvelle ligne
                connection.query('INSERT INTO produit (nom, description, fichier, categorie_id, type_id, user_id, created_at, updated_at, extension, avant, nbrimage) VALUES ?', [produits.map(p => [
                    p.nom, p.description, p.fichier, p.categorie_id, p.type_id, p.user_id, p.created_at, p.updated_at, p.extension, p.avant, p.nbrimage
                ])], (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de l'ajout de Produit :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de l'ajout de Produit" });
                    } else {
                        console.log("Produit ajouté avec succès.");
                        return res.status(200).json(result);
                    }
                });
            }
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};


const listallProduit = async (req, res) => {
    try {
        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM produit', (erreur, results) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération des Produits :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération des Produit" });
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

const detailProduit = async (req, res) => {
    try {
        const id = req.body.id;

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            connection.query('SELECT * FROM produit WHERE id = ?', [id], (erreur, result) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération de la catégorie :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération de la Produit" });
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

const deleteProduit = async (req, res) => {
    try {
        const id = req.body.id;
        const uploadsDir = path.resolve(__dirname, '../uploads');
        const corbeilleDir = path.resolve(__dirname, '../corbeille');

        // Vérifier si le dossier "corbeille" existe, sinon le créer
        if (!fs.existsSync(corbeilleDir)) {
            fs.mkdirSync(corbeilleDir);
        }

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            // Récupérer les noms des fichiers contenus dans la ligne représentant l'id
            connection.query('SELECT fichier FROM produit WHERE id = ?', [id], (erreur, resultf) => {
                if (erreur) {
                    console.error("Erreur lors de la récupération du produit :", erreur);
                    return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
                } else if (resultf.length === 0) {
                    return res.status(404).json({ erreur: "Produit non trouvé" });
                } else {
                    const fichiers = resultf[0].fichier.split(',');
                    
                    fichiers.forEach((fichier) => {
                        const oldFilePath = path.join(uploadsDir, fichier);
                        const oldFileCorbeillePath = path.join(corbeilleDir, fichier);

                        // Déplacer chaque fichier vers le dossier "corbeille" si le fichier existe
                        if (fs.existsSync(oldFilePath)) {
                            fs.rename(oldFilePath, oldFileCorbeillePath, (err) => {
                                if (err) {
                                    console.error("Erreur lors du déplacement du fichier vers la corbeille :", err);
                                    return res.status(500).json({ erreur: "Erreur lors du déplacement du fichier vers la corbeille" });
                                }
                            });
                        }
                    });

                    // Supprimer l'enregistrement de la base de données après avoir déplacé les fichiers
                    connection.query('DELETE FROM produit WHERE id = ?', [id], (erreur, result) => {
                        if (erreur) {
                            console.error("Erreur lors de la suppression du produit :", erreur);
                            return res.status(500).json({ erreur: "Erreur lors de la suppression du produit" });
                        } else {
                            console.log("Produit supprimé avec succès.");
                            return res.status(200).json({ message: "Produit supprimé avec succès.", result });
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


const updateProduit = async (req, res) => {
    try {
        const date = new Date();
        const files = req.files; // Pour gérer plusieurs fichiers
        const nbrimage = req.body.nbrimage;
        const uploadsDir = path.resolve(__dirname, '../uploads');
        const corbeilleDir = path.resolve(__dirname, '../corbeille');

        // Vérifier si le dossier "corbeille" existe, sinon le créer
        if (!fs.existsSync(corbeilleDir)) {
            fs.mkdirSync(corbeilleDir);
        }

        const produits = files.map(file => {
            const extension = path.extname(file.originalname).slice(1); // Extraire l'extension du fichier
            return {
                nom: req.body.nom,
                description: req.body.description,
                fichier: file.filename, // Nom du fichier uploadé
                categorie_id: req.body.categorie_id,
                type_id: req.body.type_id,
                user_id: req.user.id, // Utiliser l'ID de l'utilisateur connecté
                created_at: date,
                updated_at: date,
                extension: extension,
                avant: 0,
                nbrimage: nbrimage,
            };
        });

        connecter((error, connection) => {
            if (error) {
                console.error("Erreur lors de la connexion à la base de données :", error);
                return res.status(500).json({ erreur: "Erreur lors de la connexion à la base de données" });
            }

            if (nbrimage === 'un') {
                // Récupérer les noms des fichiers existants avant de mettre à jour
                connection.query('SELECT fichier FROM produit WHERE id = ?', [req.body.id], (erreur, resultf) => {
                    if (erreur) {
                        console.error("Erreur lors de la récupération du produit :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de la récupération du produit" });
                    } else if (resultf.length === 0) {
                        return res.status(404).json({ erreur: "Produit non trouvé" });
                    } else {
                        const fichiers = resultf[0].fichier.split(',');

                        // Déplacer les fichiers existants vers le dossier "corbeille"
                        fichiers.forEach((fichier) => {
                            const oldFilePath = path.join(uploadsDir, fichier);
                            const oldFileCorbeillePath = path.join(corbeilleDir, fichier);

                            if (fs.existsSync(oldFilePath)) {
                                fs.rename(oldFilePath, oldFileCorbeillePath, (err) => {
                                    if (err) {
                                        console.error("Erreur lors du déplacement du fichier vers la corbeille :", err);
                                        return res.status(500).json({ erreur: "Erreur lors du déplacement du fichier vers la corbeille" });
                                    }
                                });
                            }
                        });

                        // Concaténer les noms de fichiers pour un enregistrement unique
                        const uniqueProduit = { ...produits[0] };
                        uniqueProduit.fichier = produits.map(p => p.fichier).join(',');

                        const updateQuery = 'UPDATE produit SET ? WHERE id = ?';
                        connection.query(updateQuery, [uniqueProduit, req.body.id], (erreur, result) => {
                            if (erreur) {
                                console.error("Erreur lors de la mise à jour de Produit :", erreur);
                                return res.status(500).json({ erreur: "Erreur lors de la mise à jour de Produit" });
                            } else {
                                if (result.affectedRows === 0) {
                                    return res.status(404).json({ message: "Aucun enregistrement trouvé avec cet ID" });
                                }
                                console.log("Produit mis à jour avec succès.");
                                return res.status(200).json({ message: "Mise à jour réussie", result });
                            }
                        });
                    }
                });
            } else {
                // Pour plusieurs images, insérer chaque fichier comme une nouvelle ligne
                connection.query('INSERT INTO produit (nom, description, fichier, categorie_id, type_id, user_id, created_at, updated_at, extension, avant, nbrimage) VALUES ?', [produits.map(p => [
                    p.nom, p.description, p.fichier, p.categorie_id, p.type_id, p.user_id, p.created_at, p.updated_at, p.extension, p.avant, p.nbrimage
                ])], (erreur, result) => {
                    if (erreur) {
                        console.error("Erreur lors de l'ajout de Produit :", erreur);
                        return res.status(500).json({ erreur: "Erreur lors de l'ajout de Produit" });
                    } else {
                        console.log("Produit ajouté avec succès.");
                        return res.status(200).json(result);
                    }
                });
            }
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ erreur: "Erreur serveur" });
    }
};




module.exports = {
    ajouterProduit,
    listallProduit,
    detailProduit,
    deleteProduit,
    updateProduit
};

