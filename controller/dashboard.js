const axios = require('axios');
const { connecter } = require('../bd/connect');
require('dotenv').config();

// GET /api/v1/dashboard/stats
const getDashboardStats = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  try {
    connecter((connError, connection) => {
      if (connError) {
        return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
      }

      // Récupérer le token alloué de l'utilisateur
      connection.query('SELECT token_allouer FROM users WHERE id = ?', [userId], async (err, results) => {
        if (err) {
          return res.status(500).json({ error: 'Erreur lors de la récupération du token utilisateur' });
        }
        if (!results || results.length === 0 || !results[0].token_allouer) {
          return res.status(403).json({ error: 'Token utilisateur non trouvé' });
        }
        const userToken = results[0].token_allouer;

        try {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
          const startOfDay = `${todayStr} 00:00:00`;
          const endOfDay = `${todayStr} 23:59:59`;

          // Récupérer le nombre total d'employés sans pagination
          const totalEmployees = await new Promise((resolve) => {
            try {
              axios.get('http://54.37.15.111:80/personnel/api/employees/', {
                headers: {
                  'Authorization': `Token ${userToken}`,
                  'Content-Type': 'application/json',
                },
              })
              .then(response => {
                // Récupérer le nombre total d'employés à partir du champ count
                const totalCount = response.data.count || 0;
                resolve(totalCount);
              })
              .catch(error => {
                console.error('Erreur lors de la récupération du nombre total d\'employés:', error.message);
                resolve(0);
              });
            } catch (error) {
              console.error('Erreur lors de la récupération du nombre total d\'employés:', error.message);
              resolve(0);
            }
          });

          // 1. Statistiques des permissions et congés
          const permissionsStats = await new Promise((resolve) => {
            // Détecter dynamiquement le nom de la colonne type (type_demande vs type)
            connection.query(`SHOW COLUMNS FROM permission_conge`, (cerr, crows) => {
              if (cerr || !Array.isArray(crows)) {
                console.warn('[dashboard] show columns error:', cerr?.code || cerr?.message);
                return resolve({
                  permissions_approuvees: 0,
                  conges_approuves: 0,
                  permissions_en_attente: 0,
                  conges_en_attente: 0,
                  permissions_refusees: 0,
                  conges_refuses: 0,
                });
              }
              const columns = crows.map(r => r.Field);
              const typeField = columns.includes('type_demande') ? 'type_demande' : (columns.includes('type') ? 'type' : null);
              const statutField = columns.includes('statut') ? 'statut' : (columns.includes('status') ? 'status' : null);
              if (!typeField || !statutField) {
                return resolve({
                  permissions_approuvees: 0,
                  conges_approuves: 0,
                  permissions_en_attente: 0,
                  conges_en_attente: 0,
                  permissions_refusees: 0,
                  conges_refuses: 0,
                });
              }
              const query = `
                SELECT 
                  COUNT(CASE WHEN ${typeField} = 'permission' AND ${statutField} = 'approuve' THEN 1 END) as permissions_approuvees,
                  COUNT(CASE WHEN ${typeField} IN ('conge','congé') AND ${statutField} = 'approuve' THEN 1 END) as conges_approuves,
                  COUNT(CASE WHEN ${typeField} = 'permission' AND ${statutField} = 'en_attente' THEN 1 END) as permissions_en_attente,
                  COUNT(CASE WHEN ${typeField} IN ('conge','congé') AND ${statutField} = 'en_attente' THEN 1 END) as conges_en_attente,
                  COUNT(CASE WHEN ${typeField} = 'permission' AND ${statutField} = 'refuse' THEN 1 END) as permissions_refusees,
                  COUNT(CASE WHEN ${typeField} IN ('conge','congé') AND ${statutField} = 'refuse' THEN 1 END) as conges_refuses
                FROM permission_conge
              `;
              connection.query(query, [], (err, rows) => {
                if (err) {
                  console.warn('[dashboard] permission_conge stats error:', err.code || err.message);
                  return resolve({
                    permissions_approuvees: 0,
                    conges_approuves: 0,
                    permissions_en_attente: 0,
                    conges_en_attente: 0,
                    permissions_refusees: 0,
                    conges_refuses: 0,
                  });
                }
                resolve(rows[0] || {
                  permissions_approuvees: 0,
                  conges_approuves: 0,
                  permissions_en_attente: 0,
                  conges_en_attente: 0,
                  permissions_refusees: 0,
                  conges_refuses: 0,
                });
              });
            });
          });

          // 2. Emails envoyés aujourd'hui
          const emailsSentToday = await new Promise((resolve) => {
            // Vérifier l'existence de la table mail_queue avant de l'interroger
            connection.query(`SHOW TABLES LIKE 'mail_queue'`, (terr, trows) => {
              if (terr || !Array.isArray(trows) || trows.length === 0) {
                return resolve({ total_emails: 0, clients_contactes: null });
              }
              const query = `
                SELECT 
                  COUNT(*) as total_emails,
                  GROUP_CONCAT(DISTINCT client_name) as clients_contactes
                FROM mail_queue 
                WHERE user_id = ? AND created_at >= ? AND created_at <= ?
              `;
              connection.query(query, [userId, startOfDay, endOfDay], (err, rows) => {
                if (err) {
                  console.warn('[dashboard] mail_queue stats error:', err.code || err.message);
                  return resolve({ total_emails: 0, clients_contactes: null });
                }
                resolve(rows[0] || { total_emails: 0, clients_contactes: null });
              });
            });
          });

          // 3. Récupérer les employés et départements via API externe
          let employees = [];
          let departments = [];
          try {
            const [employeesResp, departmentsResp] = await Promise.all([
              axios.get('http://54.37.15.111:80/personnel/api/employees/', {
                headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
              }),
              axios.get('http://54.37.15.111:80/personnel/api/departments/', {
                headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
              }),
            ]);
            employees = Array.isArray(employeesResp.data?.data) ? employeesResp.data.data : (Array.isArray(employeesResp.data?.results) ? employeesResp.data.results : []);
            departments = Array.isArray(departmentsResp.data?.data) ? departmentsResp.data.data : (Array.isArray(departmentsResp.data?.results) ? departmentsResp.data.results : []);
          } catch (e) {
            console.warn('[dashboard] employees/departments API error:', e.message);
            employees = [];
            departments = [];
          }
          const departmentIdToName = {};
          departments.forEach(d => { 
            if (d && d.id) departmentIdToName[String(d.id)] = d.dept_name || d.name || String(d.id); 
          });

          // 4. Charger plannings de l'utilisateur
          const safeJson = (str, fallback) => {
            try { return JSON.parse(str); } catch { return fallback; }
          };
          const plannings = await new Promise((resolve) => {
            connection.query('SELECT * FROM plannings WHERE user_id = ? ORDER BY created_at DESC', [userId], (perr, rows) => {
              if (perr) {
                console.warn('[dashboard] plannings query error:', perr.code || perr.message);
                return resolve([]);
              }
              const parsed = (rows || []).map(p => ({
                ...p,
                jours_selectionnes: safeJson(p.jours_selectionnes || '{}', {}),
                departements: safeJson(p.departements || '[]', []),
                employes: safeJson(p.employes || '[]', []),
              }));
              resolve(parsed);
            });
          });

          // 5. Charger permissions/congés approuvés pour aujourd'hui
          const approvedLeavesToday = await new Promise((resolve) => {
            const q = `SELECT * FROM permission_conge WHERE statut = 'approuve' AND date_heure_depart <= ? AND date_heure_arrivee >= ?`;
            connection.query(q, [endOfDay, startOfDay], (lerr, lrows) => {
              if (lerr) return resolve([]);
              resolve(lrows || []);
            });
          });

          // 6. Charger transactions de présence pour aujourd'hui
          let transactions = [];
          try {
            const transactionsResp = await axios.get('http://54.37.15.111:80/iclock/api/transactions/', {
              params: { 
                emp_code: '', 
                start_time: startOfDay, 
                end_time: endOfDay 
              },
              headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
            });
            transactions = Array.isArray(transactionsResp.data?.data) ? transactionsResp.data.data : (Array.isArray(transactionsResp.data) ? transactionsResp.data : []);
          } catch (e) {
            console.warn('[dashboard] transactions API error:', e.message);
            transactions = [];
          }

          // 7. Calculer les statistiques de présence
          const presenceStats = calculatePresenceStats(employees, plannings, approvedLeavesToday, transactions, today, departmentIdToName);

          // 8. Statistiques des clients
          const clientStats = await new Promise((resolve) => {
            const query = 'SELECT COUNT(*) as total_clients FROM client WHERE user_id = ?';
            connection.query(query, [userId], (err, rows) => {
              if (err) {
                console.warn('[dashboard] client count error:', err.code || err.message);
                return resolve({ total_clients: 0 });
              }
              resolve(rows[0] || { total_clients: 0 });
            });
          });

          // 9. Statistiques des ventes (si applicable)
          const salesStats = { total_ventes_aujourd_hui: 0, montant_total_aujourd_hui: 0 };

          // 10. Statistiques des produits
          const productStats = { total_produits: 0 };

          // Préparer la réponse
          const dashboardStats = {
            permissions: {
              approuvees: permissionsStats.permissions_approuvees || 0,
              en_attente: permissionsStats.permissions_en_attente || 0,
              refusees: permissionsStats.permissions_refusees || 0
            },
            conges: {
              approuves: permissionsStats.conges_approuves || 0,
              en_attente: permissionsStats.conges_en_attente || 0,
              refuses: permissionsStats.conges_refuses || 0
            },
            presence: {
              total_employes: totalEmployees,
              presents_aujourd_hui: presenceStats.presents,
              absents_aujourd_hui: presenceStats.absents,
              retards_aujourd_hui: presenceStats.retards,
              permissions_aujourd_hui: presenceStats.permissions
            },
            emails: {
              envoyes_aujourd_hui: emailsSentToday.total_emails || 0,
              clients_contactes: emailsSentToday.clients_contactes ? emailsSentToday.clients_contactes.split(',') : []
            },
            clients: {
              total: clientStats.total_clients || 0
            },
            ventes: {
              total_aujourd_hui: salesStats.total_ventes_aujourd_hui || 0,
              montant_aujourd_hui: salesStats.montant_total_aujourd_hui || 0
            },
            produits: {
              total: productStats.total_produits || 0
            },
            date_actuelle: todayStr
          };

          res.json(dashboardStats);

        } catch (apiErr) {
          console.error('Erreur lors de la récupération des statistiques:', apiErr.message);
          // Renvoi d'une réponse partielle au lieu d'une 500 pour ne pas casser le dashboard
          return res.json({
            permissions: { approuvees: 0, en_attente: 0, refusees: 0 },
            conges: { approuves: 0, en_attente: 0, refuses: 0 },
            presence: { total_employes: 0, presents_aujourd_hui: 0, absents_aujourd_hui: 0, retards_aujourd_hui: 0, permissions_aujourd_hui: 0 },
            emails: { envoyes_aujourd_hui: 0, clients_contactes: [] },
            clients: { total: 0 },
            ventes: { total_aujourd_hui: 0, montant_aujourd_hui: 0 },
            produits: { total: 0 },
            date_actuelle: new Date().toISOString().split('T')[0],
          });
        }
      });
    });
  } catch (error) {
    console.error('Erreur interne:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Fonction utilitaire pour calculer les statistiques de présence
function calculatePresenceStats(employees, plannings, approvedLeaves, transactions, date, departmentIdToName) {
  const dayKey = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][date.getDay()];
  const dateStr = date.toISOString().split('T')[0];

  // Indexer les pointages par emp_code
  const punchesByEmp = {};
  transactions.forEach(t => {
    const code = String(t.emp_code || t.empId || t.emp || t.employee_id || '');
    if (code) {
      if (!punchesByEmp[code]) punchesByEmp[code] = [];
      punchesByEmp[code].push(new Date(t.punch_time || t.time || t.checkin_time || t.punchTime || t.timestamp));
    }
  });

  // Helpers
  const isOnApprovedLeave = (empId) => {
    return approvedLeaves.some(l => String(l.employe_id) === String(empId));
  };

  const getFirstPunchOfDay = (empCode) => {
    const punches = punchesByEmp[empCode] || [];
    return punches.length > 0 ? punches.sort((a, b) => a - b)[0] : null;
  };

  const parseTimeToDate = (baseDate, timeStr) => {
    const [hh, mm, ss] = (timeStr || '00:00:00').split(':');
    const d = new Date(baseDate);
    d.setHours(Number(hh || 0), Number(mm || 0), Number(ss || 0), 0);
    return d;
  };

  const diffMinutes = (lateDate, scheduledDate) => {
    return Math.max(0, Math.round((lateDate - scheduledDate) / 60000));
  };

  let presents = 0;
  let absents = 0;
  let retards = 0;
  let permissions = 0;

  employees.forEach(emp => {
    const empId = emp.id;
    const empCode = String(emp.emp_code || emp.code || emp.empCode || '');

    // Vérifier si l'employé est en permission/congé
    if (isOnApprovedLeave(empId)) {
      permissions++;
      return;
    }

    // Récupérer les intervalles planifiés pour cet employé
    let intervals = [];
    plannings.forEach(p => {
      const start = new Date(p.semaine_debut);
      const end = new Date(p.semaine_fin);
      if (date < start || date > end) return;

      const dayIntervals = Array.isArray(p.jours_selectionnes?.[dayKey]) ? p.jours_selectionnes[dayKey] : [];
      dayIntervals.forEach(intv => {
        const assignedList = Array.isArray(intv.employes) ? intv.employes.map(String) : [];
        const topLevelAssigned = Array.isArray(p.employes) ? p.employes.map(String) : [];
        const deptId = String(emp.department?.id || emp.department_id || emp.dept_id || '');
        const deptAssigned = Array.isArray(p.departements) ? p.departements.map(String) : [];

        const isAssigned = (assignedList.length > 0 && assignedList.includes(String(empId)))
          || (assignedList.length === 0 && (topLevelAssigned.includes(String(empId)) || deptAssigned.includes(deptId)));

        if (isAssigned && intv.debut && intv.fin && intv.type !== 'repos') {
          intervals.push({ debut: intv.debut, fin: intv.fin });
        }
      });
    });

    if (intervals.length === 0) {
      // Non planifié: pas de données pour ce jour
      return;
    }

    // Premier pointage de la journée
    const firstPunch = empCode ? getFirstPunchOfDay(empCode) : null;

    if (!firstPunch) {
      absents++;
    } else {
      // Vérifier s'il y a eu retard
      let hasRetard = false;
      intervals.forEach(intv => {
        const schedStart = parseTimeToDate(date, intv.debut);
        if (diffMinutes(firstPunch, schedStart) > 0) {
          hasRetard = true;
        }
      });

      if (hasRetard) {
        retards++;
      } else {
        presents++;
      }
    }
  });

  return { presents, absents, retards, permissions };
}

module.exports = { getDashboardStats };
