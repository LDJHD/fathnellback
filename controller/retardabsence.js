const axios = require('axios');
const { connecter } = require('../bd/connect');

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toDayKey(date) {
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  return days[date.getDay()];
}

function parseTimeToDate(baseDate, timeStr) {
  // timeStr like "08:00" or "08:00:00"
  const [hh, mm, ss] = (timeStr || '00:00:00').split(':');
  const d = new Date(baseDate);
  d.setHours(Number(hh || 0), Number(mm || 0), Number(ss || 0), 0);
  return d;
}

function diffMinutes(lateDate, scheduledDate) {
  return Math.max(0, Math.round((lateDate - scheduledDate) / 60000));
}

// GET /api/v1/retards-absences?date=YYYY-MM-DD&type=all|retard|absence&q=...&departmentId=...
const getDailyRetardsAbsences = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  const dateParam = req.query.date || formatDate(new Date());
  const filterType = (req.query.type || 'all').toLowerCase();
  const q = (req.query.q || '').toLowerCase();
  const departmentFilter = req.query.departmentId ? String(req.query.departmentId) : '';

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
          // 1) Récupérer employés et départements via API externe
          const [employeesResp, departmentsResp] = await Promise.all([
            axios.get('http://54.37.15.111:80/personnel/api/employees/', {
              headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
            }),
            axios.get('http://54.37.15.111:80/personnel/api/departments/', {
              headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
            }),
          ]);

          const employees = Array.isArray(employeesResp.data?.data) ? employeesResp.data.data : [];
          const departments = Array.isArray(departmentsResp.data?.data) ? departmentsResp.data.data : [];
          const departmentIdToName = {};
          departments.forEach(d => { if (d && d.id) departmentIdToName[String(d.id)] = d.dept_name || d.name || String(d.id); });

          // 2) Charger plannings de l'utilisateur
          const plannings = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM plannings WHERE user_id = ? ORDER BY created_at DESC', [userId], (perr, rows) => {
              if (perr) return reject(perr);
              const parsed = rows.map(p => ({
                ...p,
                jours_selectionnes: JSON.parse(p.jours_selectionnes || '{}'),
                departements: JSON.parse(p.departements || '[]'),
                employes: JSON.parse(p.employes || '[]'),
              }));
              resolve(parsed);
            });
          });

          // 3) Charger permissions/congés approuvés qui couvrent la date
          const startOfDay = new Date(dateParam + 'T00:00:00');
          const endOfDay = new Date(dateParam + 'T23:59:59');

          const approvedLeaves = await new Promise((resolve) => {
            const q = `SELECT * FROM permission_conge WHERE statut = 'approuve' AND date_heure_depart <= ? AND date_heure_arrivee >= ?`;
            connection.query(q, [endOfDay, startOfDay], (lerr, lrows) => {
              if (lerr) return resolve([]);
              resolve(lrows || []);
            });
          });

          // 4) Charger transactions de présence pour la journée (tous employés)
          const transactionsResp = await axios.get('http://54.37.15.111:80/iclock/api/transactions/', {
            params: { emp_code: '', start_time: `${dateParam} 00:00:00`, end_time: `${dateParam} 23:59:59` },
            headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
          });
          const transactions = Array.isArray(transactionsResp.data?.data) ? transactionsResp.data.data : (Array.isArray(transactionsResp.data) ? transactionsResp.data : []);

          // Indexer premier pointage par emp_code
          const firstPunchByEmpCode = {};
          transactions.forEach(t => {
            const code = String(t.emp_code || t.empId || t.emp || t.employee_id || '');
            const punch = new Date(t.punch_time || t.time || t.checkin_time || t.punchTime || t.timestamp || dateParam + 'T00:00:00');
            if (!code) return;
            if (!firstPunchByEmpCode[code] || punch < firstPunchByEmpCode[code]) {
              firstPunchByEmpCode[code] = punch;
            }
          });

          const dayKey = toDayKey(startOfDay); // lundi, mardi, ...

          // Helpers
          const isOnApprovedLeave = (empId) => {
            return approvedLeaves.some(l => String(l.employe_id) === String(empId));
          };

          const results = [];

          employees.forEach(emp => {
            const empId = emp.id;
            const empCode = String(emp.emp_code || emp.code || emp.empCode || '');
            const deptId = String(emp.department?.id || emp.department_id || emp.dept_id || '');
            const deptName = departmentIdToName[deptId] || emp.department?.dept_name || emp.department?.name || '';

            // Filtre département (si fourni)
            if (departmentFilter && deptId !== departmentFilter) return;
            // Filtre q sur prénom (first_name)
            if (q && !(String(emp.first_name || emp.prenom || '').toLowerCase().includes(q))) return;

            // Récupérer tous les intervalles planifiés pour cet employé ce jour
            let intervals = [];
            plannings.forEach(p => {
              // vérifier date dans plage
              const start = new Date(p.semaine_debut);
              const end = new Date(p.semaine_fin);
              if (startOfDay < start || startOfDay > end) return;

              const dayIntervals = Array.isArray(p.jours_selectionnes?.[dayKey]) ? p.jours_selectionnes[dayKey] : [];
              dayIntervals.forEach(intv => {
                const assignedList = Array.isArray(intv.employes) ? intv.employes.map(String) : [];
                const topLevelAssigned = Array.isArray(p.employes) ? p.employes.map(String) : [];
                const deptAssigned = Array.isArray(p.departements) ? p.departements.map(String) : [];

                const isAssigned = (assignedList.length > 0 && assignedList.includes(String(empId)))
                  || (assignedList.length === 0 && (topLevelAssigned.includes(String(empId)) || deptAssigned.includes(deptId)));

                if (isAssigned && intv.debut && intv.fin && intv.type !== 'repos') {
                  intervals.push({ debut: intv.debut, fin: intv.fin });
                }
              });
            });

            if (intervals.length === 0) {
              // Non planifié: ne pas compter
              return;
            }

            // Ignore si en permission/congé approuvé couvrant la journée
            if (isOnApprovedLeave(empId)) {
              return;
            }

            // Premier pointage de la journée
            const firstPunch = empCode ? firstPunchByEmpCode[empCode] : undefined;

            // Calcul des retards/absences par comparaison aux intervalles
            let totalPlannedMinutes = 0;
            let totalLateMinutes = 0;
            let hadAnyPresence = !!firstPunch;

            intervals.forEach(intv => {
              const schedStart = parseTimeToDate(startOfDay, intv.debut);
              const schedEnd = parseTimeToDate(startOfDay, intv.fin);
              totalPlannedMinutes += Math.max(0, Math.round((schedEnd - schedStart) / 60000));

              if (firstPunch) {
                // En retard si premier pointage est après l'heure de début prévue de ce premier intervalle
                totalLateMinutes += diffMinutes(firstPunch, schedStart);
              }
            });

            if (!hadAnyPresence) {
              // Absent: durée d'absence = minutes planifiées totales
              const item = {
                type: 'absence',
                employee_id: empId,
                emp_code: empCode,
                first_name: emp.first_name || emp.prenom || '',
                last_name: emp.last_name || emp.nom || '',
                department_id: deptId,
                department_name: deptName,
                date: dateParam,
                planned_minutes: totalPlannedMinutes,
                late_minutes: 0,
                first_punch: null,
              };
              results.push(item);
            } else {
              if (totalLateMinutes > 0) {
                const item = {
                  type: 'retard',
                  employee_id: empId,
                  emp_code: empCode,
                  first_name: emp.first_name || emp.prenom || '',
                  last_name: emp.last_name || emp.nom || '',
                  department_id: deptId,
                  department_name: deptName,
                  date: dateParam,
                  planned_minutes: totalPlannedMinutes,
                  late_minutes: totalLateMinutes,
                  first_punch: firstPunch,
                };
                results.push(item);
              }
            }
          });

          // Filtre type
          const filtered = results.filter(r => {
            if (filterType === 'retard') return r.type === 'retard';
            if (filterType === 'absence') return r.type === 'absence';
            return true;
          });

          res.json(filtered);
        } catch (apiErr) {
          console.error('Erreur lors du calcul retards/absences:', apiErr.message);
          res.status(500).json({ error: 'Erreur lors de la récupération des données externes' });
        }
      });
    });
  } catch (error) {
    console.error('Erreur interne:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

module.exports = { getDailyRetardsAbsences };


