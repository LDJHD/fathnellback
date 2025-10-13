const { connecter } = require('../bd/connect');

// Créer une nouvelle permission/congé
const createPermissionConge = async (req, res) => {
    try {
        const {
            employe_id,
            type_demande,
            type_conge_id,
            type_permission_id,
            date_heure_depart,
            date_heure_arrivee,
            note
        } = req.body;

        // Validation des données
        if (!employe_id || !type_demande || !date_heure_depart || !date_heure_arrivee) {
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
        }

        // Validation selon le type de demande
        if (type_demande === 'conge' && !type_conge_id) {
            return res.status(400).json({ error: 'Le type de congé est obligatoire' });
        }

        if (type_demande === 'permission' && !type_permission_id) {
            return res.status(400).json({ error: 'Le type de permission est obligatoire' });
        }

        // Validation des dates
        const depart = new Date(date_heure_depart);
        const arrivee = new Date(date_heure_arrivee);
        
        if (depart >= arrivee) {
            return res.status(400).json({ error: 'La date de départ doit être antérieure à la date d\'arrivée' });
        }

        const query = `
            INSERT INTO permission_conge 
            (employe_id, type_demande, type_conge_id, type_permission_id, date_heure_depart, date_heure_arrivee, note)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            employe_id,
            type_demande,
            type_demande === 'conge' ? type_conge_id : null,
            type_demande === 'permission' ? type_permission_id : null,
            date_heure_depart,
            date_heure_arrivee,
            note || null
        ];

        connecter((error, pool) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            
            pool.getConnection((connectionError, connection) => {
                if (connectionError) {
                    console.error('Erreur lors de l\'obtention de la connexion:', connectionError);
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                }

                connection.query(query, values, (error, results) => {
                    if (error) {
                        console.error('Erreur lors de la création de la permission/congé:', error);
                        connection.release();
                        return res.status(500).json({ error: 'Erreur lors de la création de la permission/congé' });
                    }

                    connection.release();
                    res.status(201).json({
                        message: 'Permission/congé créé avec succès',
                        id: results.insertId
                    });
                });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la création de la permission/congé:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Récupérer toutes les permissions/congés
const getAllPermissionConge = async (req, res) => {
    try {
        console.log('Début de getAllPermissionConge');
        
        connecter((error, pool) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            
            console.log('Connexion établie, récupération des données...');
            
            pool.getConnection((connectionError, connection) => {
                if (connectionError) {
                    console.error('Erreur lors de l\'obtention de la connexion:', connectionError);
                    return res.status(500).json({ error: 'Erreur lors de l\'obtention de la connexion' });
                }

                // Requête simple sans JOIN
                const query = `
                    SELECT * FROM permission_conge 
                    ORDER BY created_at DESC
                `;
                
                connection.query(query, async (error, results) => {
                    if (error) {
                        console.error('Erreur SQL détaillée:', error);
                        console.error('Code d\'erreur MySQL:', error.code);
                        console.error('Message d\'erreur MySQL:', error.message);
                        console.error('Numéro d\'erreur MySQL:', error.errno);
                        connection.release();
                        return res.status(500).json({ 
                            error: 'Erreur lors de la récupération des permissions/congés',
                            details: error.message,
                            code: error.code
                        });
                    }

                    console.log(`Récupération réussie: ${results.length} enregistrements trouvés`);
                    
                    // Récupérer les informations des employés depuis l'API externe
                    try {
                        const axios = require('axios');
                        const jwtToken = req.headers.authorization?.split(' ')[1]; // Récupérer le token JWT
                        
                        if (!jwtToken) {
                            console.log('Aucun token JWT trouvé, utilisation des données de base');
                            // Traiter les résultats sans les informations des employés
                            const processedResults = results.map(item => {
                                if (item.type_demande === 'conge') {
                                    item.type_affichage = 'Congé';
                                    item.badge_type = 'conge';
                                } else if (item.type_demande === 'permission') {
                                    item.type_affichage = 'Permission';
                                    item.badge_type = 'permission';
                                } else {
                                    item.type_affichage = 'Non défini';
                                    item.badge_type = 'undefined';
                                }
                                
                                item.employe_nom = `ID: ${item.employe_id}`;
                                item.employe_prenom = '';
                                
                                return item;
                            });
                            
                            connection.release();
                            return res.json(processedResults);
                        }

                        // Récupérer le token_allouer de l'utilisateur connecté
                        const userQuery = 'SELECT token_allouer FROM users WHERE id = ?';
                        const userId = req.user?.id; // Récupérer l'ID de l'utilisateur depuis le middleware auth
                        
                        if (!userId) {
                            console.log('Aucun utilisateur connecté trouvé, utilisation des données de base');
                            const processedResults = results.map(item => {
                                if (item.type_demande === 'conge') {
                                    item.type_affichage = 'Congé';
                                    item.badge_type = 'conge';
                                } else if (item.type_demande === 'permission') {
                                    item.type_affichage = 'Permission';
                                    item.badge_type = 'permission';
                                } else {
                                    item.type_affichage = 'Non défini';
                                    item.badge_type = 'undefined';
                                }
                                
                                item.employe_nom = `ID: ${item.employe_id}`;
                                item.employe_prenom = '';
                                
                                return item;
                            });
                            
                            connection.release();
                            return res.json(processedResults);
                        }

                        // Récupérer le token_allouer
                        connection.query(userQuery, [userId], async (userError, userResults) => {
                            if (userError || !userResults || !userResults[0] || !userResults[0].token_allouer) {
                                console.log('Aucun token_allouer trouvé, utilisation des données de base');
                                const processedResults = results.map(item => {
                                    if (item.type_demande === 'conge') {
                                        item.type_affichage = 'Congé';
                                        item.badge_type = 'conge';
                                    } else if (item.type_demande === 'permission') {
                                        item.type_affichage = 'Permission';
                                        item.badge_type = 'permission';
                                    } else {
                                        item.type_affichage = 'Non défini';
                                        item.badge_type = 'undefined';
                                    }
                                    
                                    item.employe_nom = `ID: ${item.employe_id}`;
                                    item.employe_prenom = '';
                                    
                                    return item;
                                });
                                
                                connection.release();
                                return res.json(processedResults);
                            }

                            const tokenAllouer = userResults[0].token_allouer;
                            console.log('Token alloué récupéré, récupération des employés depuis l\'API externe');

                            // Récupérer la liste des employés depuis l'API externe
                            const employeesResponse = await axios.get('http://54.37.15.111:80/personnel/api/employees/', {
                                headers: {
                                    'Authorization': `Token ${tokenAllouer}`,
                                    'Content-Type': 'application/json',
                                },
                            });

                            const employees = employeesResponse.data.data || [];
                            console.log(`Récupération de ${employees.length} employés depuis l'API externe`);

                            // Créer un map des employés pour un accès rapide
                            const employeesMap = {};
                            employees.forEach(emp => {
                                employeesMap[emp.id] = emp;
                            });

                            // Traiter les résultats avec les informations des employés
                            const processedResults = results.map(item => {
                                const employee = employeesMap[item.employe_id];
                                
                                // Déterminer le type d'affichage basé sur type_demande
                                if (item.type_demande === 'conge') {
                                    item.type_affichage = 'Congé';
                                    item.badge_type = 'conge';
                                } else if (item.type_demande === 'permission') {
                                    item.type_affichage = 'Permission';
                                    item.badge_type = 'permission';
                                } else {
                                    item.type_affichage = 'Non défini';
                                    item.badge_type = 'undefined';
                                }
                                
                                if (employee) {
                                    item.employe_nom = employee.first_name || employee.name || employee.prenom || `ID: ${item.employe_id}`;
                                    item.employe_prenom = '';
                                } else {
                                    item.employe_nom = `ID: ${item.employe_id}`;
                                    item.employe_prenom = '';
                                }
                                
                                console.log(`Item ${item.id}: type_demande=${item.type_demande}, type_affichage=${item.type_affichage}, badge_type=${item.badge_type}, employe_nom=${item.employe_nom}`);
                                
                                return item;
                            });

                            connection.release();
                            res.json(processedResults);

                        });

                    } catch (apiError) {
                        console.error('Erreur lors de la récupération des employés depuis l\'API externe:', apiError.message);
                        
                        // En cas d'erreur API, retourner les données de base
                        const processedResults = results.map(item => {
                            if (item.type_demande === 'conge') {
                                item.type_affichage = 'Congé';
                                item.badge_type = 'conge';
                            } else if (item.type_demande === 'permission') {
                                item.type_affichage = 'Permission';
                                item.badge_type = 'permission';
                            } else {
                                item.type_affichage = 'Non défini';
                                item.badge_type = 'undefined';
                            }
                            
                            item.employe_nom = `ID: ${item.employe_id}`;
                            item.employe_prenom = '';
                            
                            return item;
                        });
                        
                        connection.release();
                        res.json(processedResults);
                    }
                });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des permissions/congés:', error);
        res.status(500).json({ error: 'Erreur interne du serveur: ' + error.message });
    }
};

// Récupérer une permission/congé par ID
const getPermissionCongeById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                pc.*,
                tc.nom as type_conge_nom,
                tc.couleur as type_conge_couleur,
                tp.nom as type_permission_nom,
                tp.couleur as type_permission_couleur
            FROM permission_conge pc
            LEFT JOIN type_conge tc ON pc.type_conge_id = tc.id
            LEFT JOIN type_permission tp ON pc.type_permission_id = tp.id
            WHERE pc.id = ?
        `;

        connecter((error, pool) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            
            pool.getConnection((connectionError, connection) => {
                if (connectionError) {
                    console.error('Erreur lors de l\'obtention de la connexion:', connectionError);
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                }

                connection.query(query, [id], (error, results) => {
                    if (error) {
                        console.error('Erreur lors de la récupération de la permission/congé:', error);
                        connection.release();
                        return res.status(500).json({ error: 'Erreur lors de la récupération de la permission/congé' });
                    }

                    if (results.length === 0) {
                        connection.release();
                        return res.status(404).json({ error: 'Permission/congé non trouvé' });
                    }

                    connection.release();
                    res.json(results[0]);
                });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de la permission/congé:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Mettre à jour une permission/congé
const updatePermissionConge = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            employe_id,
            type_demande,
            type_conge_id,
            type_permission_id,
            date_heure_depart,
            date_heure_arrivee,
            note,
            statut,
            approuve_par
        } = req.body;

        // Validation des données
        if (!employe_id || !type_demande || !date_heure_depart || !date_heure_arrivee) {
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
        }

        // Validation selon le type de demande
        if (type_demande === 'conge' && !type_conge_id) {
            return res.status(400).json({ error: 'Le type de congé est obligatoire' });
        }

        if (type_demande === 'permission' && !type_permission_id) {
            return res.status(400).json({ error: 'Le type de permission est obligatoire' });
        }

        // Validation des dates
        const depart = new Date(date_heure_depart);
        const arrivee = new Date(date_heure_arrivee);
        
        if (depart >= arrivee) {
            return res.status(400).json({ error: 'La date de départ doit être antérieure à la date d\'arrivée' });
        }

        const query = `
            UPDATE permission_conge 
            SET 
                employe_id = ?,
                type_demande = ?,
                type_conge_id = ?,
                type_permission_id = ?,
                date_heure_depart = ?,
                date_heure_arrivee = ?,
                note = ?,
                statut = ?,
                approuve_par = ?,
                date_approbation = CASE WHEN ? IS NOT NULL AND statut != 'en_attente' THEN NOW() ELSE date_approbation END
            WHERE id = ?
        `;

        const values = [
            employe_id,
            type_demande,
            type_demande === 'conge' ? type_conge_id : null,
            type_demande === 'permission' ? type_permission_id : null,
            date_heure_depart,
            date_heure_arrivee,
            note || null,
            statut || 'en_attente',
            approuve_par || null,
            approuve_par,
            id
        ];

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Erreur lors de la mise à jour de la permission/congé:', error);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour de la permission/congé' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Permission/congé non trouvé' });
            }

            res.json({ message: 'Permission/congé mis à jour avec succès' });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de la permission/congé:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Supprimer une permission/congé
const deletePermissionConge = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM permission_conge WHERE id = ?';

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, [id], (error, results) => {
            if (error) {
                console.error('Erreur lors de la suppression de la permission/congé:', error);
                return res.status(500).json({ error: 'Erreur lors de la suppression de la permission/congé' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Permission/congé non trouvé' });
            }

            res.json({ message: 'Permission/congé supprimé avec succès' });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de la permission/congé:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Récupérer tous les types de congés
const getAllTypeConge = async (req, res) => {
    try {
        const query = 'SELECT * FROM type_conge WHERE actif = TRUE ORDER BY nom';

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des types de congés:', error);
                return res.status(500).json({ error: 'Erreur lors de la récupération des types de congés' });
            }

            res.json(results);
            });
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des types de congés:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Créer un nouveau type de congé
const createTypeConge = async (req, res) => {
    try {
        const { nom, description, couleur } = req.body;

        if (!nom) {
            return res.status(400).json({ error: 'Le nom du type de congé est obligatoire' });
        }

        const query = 'INSERT INTO type_conge (nom, description, couleur) VALUES (?, ?, ?)';
        const values = [nom, description || null, couleur || '#3B82F6'];

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Erreur lors de la création du type de congé:', error);
                return res.status(500).json({ error: 'Erreur lors de la création du type de congé' });
            }

            res.status(201).json({
                message: 'Type de congé créé avec succès',
                id: results.insertId
            });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la création du type de congé:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Mettre à jour un type de congé
const updateTypeConge = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description, couleur, actif } = req.body;

        if (!nom) {
            return res.status(400).json({ error: 'Le nom du type de congé est obligatoire' });
        }

        const query = 'UPDATE type_conge SET nom = ?, description = ?, couleur = ?, actif = ? WHERE id = ?';
        const values = [nom, description || null, couleur || '#3B82F6', actif !== undefined ? actif : true, id];

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Erreur lors de la mise à jour du type de congé:', error);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour du type de congé' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Type de congé non trouvé' });
            }

            res.json({ message: 'Type de congé mis à jour avec succès' });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du type de congé:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Supprimer un type de congé
const deleteTypeConge = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM type_conge WHERE id = ?';

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, [id], (error, results) => {
            if (error) {
                console.error('Erreur lors de la suppression du type de congé:', error);
                return res.status(500).json({ error: 'Erreur lors de la suppression du type de congé' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Type de congé non trouvé' });
            }

            res.json({ message: 'Type de congé supprimé avec succès' });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du type de congé:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Récupérer tous les types de permissions
const getAllTypePermission = async (req, res) => {
    try {
        const query = 'SELECT * FROM type_permission WHERE actif = TRUE ORDER BY nom';

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des types de permissions:', error);
                return res.status(500).json({ error: 'Erreur lors de la récupération des types de permissions' });
            }

            res.json(results);
            });
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des types de permissions:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Créer un nouveau type de permission
const createTypePermission = async (req, res) => {
    try {
        const { nom, description, couleur } = req.body;

        if (!nom) {
            return res.status(400).json({ error: 'Le nom du type de permission est obligatoire' });
        }

        const query = 'INSERT INTO type_permission (nom, description, couleur) VALUES (?, ?, ?)';
        const values = [nom, description || null, couleur || '#10B981'];

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Erreur lors de la création du type de permission:', error);
                return res.status(500).json({ error: 'Erreur lors de la création du type de permission' });
            }

            res.status(201).json({
                message: 'Type de permission créé avec succès',
                id: results.insertId
            });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la création du type de permission:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Mettre à jour un type de permission
const updateTypePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description, couleur, actif } = req.body;

        if (!nom) {
            return res.status(400).json({ error: 'Le nom du type de permission est obligatoire' });
        }

        const query = 'UPDATE type_permission SET nom = ?, description = ?, couleur = ?, actif = ? WHERE id = ?';
        const values = [nom, description || null, couleur || '#10B981', actif !== undefined ? actif : true, id];

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, values, (error, results) => {
            if (error) {
                console.error('Erreur lors de la mise à jour du type de permission:', error);
                return res.status(500).json({ error: 'Erreur lors de la mise à jour du type de permission' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Type de permission non trouvé' });
            }

            res.json({ message: 'Type de permission mis à jour avec succès' });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du type de permission:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Supprimer un type de permission
const deleteTypePermission = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM type_permission WHERE id = ?';

        connecter((error, connection) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            connection.query(query, [id], (error, results) => {
            if (error) {
                console.error('Erreur lors de la suppression du type de permission:', error);
                return res.status(500).json({ error: 'Erreur lors de la suppression du type de permission' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Type de permission non trouvé' });
            }

            res.json({ message: 'Type de permission supprimé avec succès' });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du type de permission:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Valider une demande de permission/congé
const validerDemande = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        if (!['approuve', 'refuse'].includes(statut)) {
            return res.status(400).json({ error: 'Statut invalide. Doit être "approuve" ou "refuse"' });
        }

        const query = 'UPDATE permission_conge SET statut = ?, updated_at = NOW() WHERE id = ?';

        connecter((error, pool) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            
            pool.getConnection((connectionError, connection) => {
                if (connectionError) {
                    console.error('Erreur lors de l\'obtention de la connexion:', connectionError);
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                }

                connection.query(query, [statut, id], (error, results) => {
                    if (error) {
                        console.error('Erreur lors de la validation de la demande:', error);
                        connection.release();
                        return res.status(500).json({ error: 'Erreur lors de la validation de la demande' });
                    }

                    if (results.affectedRows === 0) {
                        connection.release();
                        return res.status(404).json({ error: 'Demande non trouvée' });
                    }

                    connection.release();
                    res.json({
                        message: `Demande ${statut === 'approuve' ? 'approuvée' : 'refusée'} avec succès`,
                        statut: statut
                    });
                });
            });
        });

    } catch (error) {
        console.error('Erreur lors de la validation de la demande:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// Calculer le temps restant pour une demande approuvée
const getTempsRestant = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                date_heure_depart,
                date_heure_arrivee,
                statut
            FROM permission_conge 
            WHERE id = ?
        `;

        connecter((error, pool) => {
            if (error) {
                console.error('Erreur de connexion à la base de données:', error);
                return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
            }
            
            pool.getConnection((connectionError, connection) => {
                if (connectionError) {
                    console.error('Erreur lors de l\'obtention de la connexion:', connectionError);
                    return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
                }

                connection.query(query, [id], (error, results) => {
                    if (error) {
                        console.error('Erreur lors de la récupération des dates:', error);
                        connection.release();
                        return res.status(500).json({ error: 'Erreur lors de la récupération des dates' });
                    }

                    if (results.length === 0) {
                        connection.release();
                        return res.status(404).json({ error: 'Demande non trouvée' });
                    }

                    const demande = results[0];
                    
                    if (demande.statut !== 'approuve') {
                        connection.release();
                        return res.json({
                            message: 'La demande n\'est pas encore approuvée',
                            temps_restant: null
                        });
                    }

                    const now = new Date();
                    const dateFin = new Date(demande.date_heure_arrivee);
                    const tempsRestant = dateFin - now;

                    if (tempsRestant <= 0) {
                        connection.release();
                        return res.json({
                            message: 'La période est terminée',
                            temps_restant: 0,
                            statut: 'termine'
                        });
                    }

                    // Convertir en heures et minutes
                    const heures = Math.floor(tempsRestant / (1000 * 60 * 60));
                    const minutes = Math.floor((tempsRestant % (1000 * 60 * 60)) / (1000 * 60));

                    connection.release();
                    res.json({
                        temps_restant: tempsRestant,
                        heures: heures,
                        minutes: minutes,
                        statut: 'en_cours'
                    });
                });
            });
        });

    } catch (error) {
        console.error('Erreur lors du calcul du temps restant:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

module.exports = {
    // Permissions et congés
    createPermissionConge,
    getAllPermissionConge,
    getPermissionCongeById,
    updatePermissionConge,
    deletePermissionConge,
    
    // Types de congés
    getAllTypeConge,
    createTypeConge,
    updateTypeConge,
    deleteTypeConge,
    
    // Types de permissions
    getAllTypePermission,
    createTypePermission,
    updateTypePermission,
    deleteTypePermission,
    validerDemande,
    getTempsRestant
};
