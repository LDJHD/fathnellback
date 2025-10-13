const mysql = require('mysql');
const { connecter } = require('../bd/connect');

// Créer un nouveau planning
const createPlanning = (req, res) => {
  const {
    nom_planning,
    semaine_debut,
    semaine_fin,
    jours_selectionnes,
    departements,
    employes,
    remarques
  } = req.body;

  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  // Validation des données requises
  if (!nom_planning || !semaine_debut || !semaine_fin) {
    return res.status(400).json({ error: 'Nom du planning, date de début et date de fin sont requis' });
  }

  connecter((error, connection) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }

    // Calculer les heures de début et fin basées sur les intervalles
    let heure_debut = '08:00:00';
    let heure_fin = '17:00:00';
    
    if (jours_selectionnes) {
      const allIntervals = Object.values(jours_selectionnes).flat();
      if (allIntervals.length > 0) {
        const times = allIntervals
          .map(interval => [interval.debut, interval.fin])
          .flat()
          .filter(time => time && time !== '');
        
        if (times.length > 0) {
          heure_debut = times.reduce((earliest, time) => time < earliest ? time : earliest);
          heure_fin = times.reduce((latest, time) => time > latest ? time : latest);
        }
      }
    }

    const planningData = {
      nom_planning,
      semaine_debut,
      semaine_fin,
      jours_selectionnes: JSON.stringify(jours_selectionnes || {}),
      departements: JSON.stringify(departements || []),
      employes: JSON.stringify(employes || []),
      heure_debut,
      heure_fin,
      remarques: JSON.stringify(remarques || {}),
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    };

    const query = 'INSERT INTO plannings SET ?';
    
    connection.query(query, planningData, (err, result) => {
      if (err) {
        console.error('Erreur lors de la création du planning:', err);
        return res.status(500).json({ error: 'Erreur lors de la création du planning' });
      }

      res.status(201).json({
        message: 'Planning créé avec succès',
        planning_id: result.insertId
      });
    });
  });
};

// Récupérer tous les plannings
const getAllPlannings = (req, res) => {
  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  connecter((error, connection) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }

    const query = 'SELECT * FROM plannings WHERE user_id = ? ORDER BY created_at DESC';
    
    connection.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des plannings:', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération des plannings' });
      }

      // Parser les champs JSON
      const plannings = results.map(planning => ({
        ...planning,
        jours_selectionnes: JSON.parse(planning.jours_selectionnes || '[]'),
        departements: JSON.parse(planning.departements || '[]'),
        employes: JSON.parse(planning.employes || '[]'),
        remarques: JSON.parse(planning.remarques || '{}')
      }));

      res.json(plannings);
    });
  });
};

// Récupérer un planning par ID
const getPlanningById = (req, res) => {
  const { id } = req.params;
  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  connecter((error, connection) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }

    const query = 'SELECT * FROM plannings WHERE id = ? AND user_id = ?';
    
    connection.query(query, [id, userId], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération du planning:', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération du planning' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Planning non trouvé' });
      }

      const planning = results[0];
      
      // Parser les champs JSON
      const planningData = {
        ...planning,
        jours_selectionnes: JSON.parse(planning.jours_selectionnes || '[]'),
        departements: JSON.parse(planning.departements || '[]'),
        employes: JSON.parse(planning.employes || '[]'),
        remarques: JSON.parse(planning.remarques || '{}')
      };

      res.json(planningData);
    });
  });
};

// Mettre à jour un planning
const updatePlanning = (req, res) => {
  const { id } = req.params;
  const {
    nom_planning,
    semaine_debut,
    semaine_fin,
    jours_selectionnes,
    departements,
    employes,
    remarques
  } = req.body;

  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  connecter((error, connection) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }

    // Calculer les heures de début et fin basées sur les intervalles
    let heure_debut = '08:00:00';
    let heure_fin = '17:00:00';
    
    if (jours_selectionnes) {
      const allIntervals = Object.values(jours_selectionnes).flat();
      if (allIntervals.length > 0) {
        const times = allIntervals
          .map(interval => [interval.debut, interval.fin])
          .flat()
          .filter(time => time && time !== '');
        
        if (times.length > 0) {
          heure_debut = times.reduce((earliest, time) => time < earliest ? time : earliest);
          heure_fin = times.reduce((latest, time) => time > latest ? time : latest);
        }
      }
    }

    const planningData = {
      nom_planning,
      semaine_debut,
      semaine_fin,
      jours_selectionnes: JSON.stringify(jours_selectionnes || {}),
      departements: JSON.stringify(departements || []),
      employes: JSON.stringify(employes || []),
      heure_debut,
      heure_fin,
      remarques: JSON.stringify(remarques || {}),
      updated_at: new Date()
    };

    const query = 'UPDATE plannings SET ? WHERE id = ? AND user_id = ?';
    
    connection.query(query, [planningData, id, userId], (err, result) => {
      if (err) {
        console.error('Erreur lors de la mise à jour du planning:', err);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du planning' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Planning non trouvé ou non autorisé' });
      }

      res.json({ message: 'Planning mis à jour avec succès' });
    });
  });
};

// Supprimer un planning
const deletePlanning = (req, res) => {
  const { id } = req.params;
  const userId = req.user && req.user.id;

  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  connecter((error, connection) => {
    if (error) {
      return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
    }

    const query = 'DELETE FROM plannings WHERE id = ? AND user_id = ?';
    
    connection.query(query, [id, userId], (err, result) => {
      if (err) {
        console.error('Erreur lors de la suppression du planning:', err);
        return res.status(500).json({ error: 'Erreur lors de la suppression du planning' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Planning non trouvé ou non autorisé' });
      }

      res.json({ message: 'Planning supprimé avec succès' });
    });
  });
};

module.exports = {
  createPlanning,
  getAllPlannings,
  getPlanningById,
  updatePlanning,
  deletePlanning
}; 