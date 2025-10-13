// const axios = require('axios');
// const { connecter } = require('../bd/connect');

// function formatDate(date) {
//   const y = date.getFullYear();
//   const m = String(date.getMonth() + 1).padStart(2, '0');
//   const d = String(date.getDate()).padStart(2, '0');
//   return `${y}-${m}-${d}`;
// }

// function toDayKey(date) {
//   const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
//   return days[date.getDay()];
// }

// function parseTimeToDate(baseDate, timeStr) {
//   const [hh, mm, ss] = (timeStr || '00:00:00').split(':');
//   const d = new Date(baseDate);
//   d.setHours(Number(hh || 0), Number(mm || 0), Number(ss || 0), 0);
//   return d;
// }

// function diffMinutes(lateDate, scheduledDate) {
//   return Math.max(0, Math.round((lateDate - scheduledDate) / 60000));
// }

// // GET /api/v1/ponctualite?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=employee|department&employeeId=...&departmentId=...
// const getPonctualiteReport = async (req, res) => {
//   const userId = req.user && req.user.id;
//   if (!userId) {
//     return res.status(401).json({ error: 'Utilisateur non authentifié' });
//   }

//   const { startDate, endDate, type, employeeId, departmentId } = req.query;

//   if (!startDate || !endDate || !type) {
//     return res.status(400).json({ error: 'Paramètres manquants' });
//   }

//   if (type === 'employee' && !employeeId) {
//     return res.status(400).json({ error: 'ID employé requis pour le type employee' });
//   }

//   if (type === 'department' && !departmentId) {
//     return res.status(400).json({ error: 'ID département requis pour le type department' });
//   }

//   try {
//     connecter((connError, connection) => {
//       if (connError) {
//         return res.status(500).json({ error: 'Erreur de connexion à la base de données' });
//       }

//       // Récupérer le token alloué de l'utilisateur
//       connection.query('SELECT token_allouer FROM users WHERE id = ?', [userId], async (err, results) => {
//         if (err) {
//           return res.status(500).json({ error: 'Erreur lors de la récupération du token utilisateur' });
//         }
//         if (!results || results.length === 0 || !results[0].token_allouer) {
//           return res.status(403).json({ error: 'Token utilisateur non trouvé' });
//         }
//         const userToken = results[0].token_allouer;

//         try {
//           // 1) Récupérer employés et départements via API externe
//           const [employeesResp, departmentsResp] = await Promise.all([
//             axios.get('http://54.37.15.111:80/personnel/api/employees/', {
//               headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
//             }),
//             axios.get('http://54.37.15.111:80/personnel/api/departments/', {
//               headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
//             }),
//           ]);

//           const employees = Array.isArray(employeesResp.data?.data) ? employeesResp.data.data : [];
//           const departments = Array.isArray(departmentsResp.data?.data) ? departmentsResp.data.data : [];
//           const departmentIdToName = {};
//           departments.forEach(d => { 
//             if (d && d.id) departmentIdToName[String(d.id)] = d.dept_name || d.name || String(d.id); 
//           });

//           // 2) Filtrer les employés selon le type de sélection
//           let targetEmployees = [];
//           if (type === 'employee') {
//             targetEmployees = employees.filter(emp => String(emp.id) === String(employeeId));
//           } else if (type === 'department') {
//             targetEmployees = employees.filter(emp => String(emp.department?.id || emp.department_id || emp.dept_id) === String(departmentId));
//           }

//           if (targetEmployees.length === 0) {
//             return res.json([]);
//           }

//           // 3) Charger plannings de l'utilisateur
//           const plannings = await new Promise((resolve, reject) => {
//             connection.query('SELECT * FROM plannings WHERE user_id = ? ORDER BY created_at DESC', [userId], (perr, rows) => {
//               if (perr) return reject(perr);
//               const parsed = rows.map(p => ({
//                 ...p,
//                 jours_selectionnes: JSON.parse(p.jours_selectionnes || '{}'),
//                 departements: JSON.parse(p.departements || '[]'),
//                 employes: JSON.parse(p.employes || '[]'),
//               }));
//               resolve(parsed);
//             });
//           });

//           // 4) Charger permissions/congés approuvés pour la période
//           const startOfPeriod = new Date(startDate + 'T00:00:00');
//           const endOfPeriod = new Date(endDate + 'T23:59:59');

//           const approvedLeaves = await new Promise((resolve) => {
//             const q = `SELECT * FROM permission_conge WHERE statut = 'approuve' AND date_heure_depart <= ? AND date_heure_arrivee >= ?`;
//             connection.query(q, [endOfPeriod, startOfPeriod], (lerr, lrows) => {
//               if (lerr) return resolve([]);
//               resolve(lrows || []);
//             });
//           });

//           // 5) Charger transactions de présence pour la période
//           const transactionsResp = await axios.get('http://54.37.15.111:80/iclock/api/transactions/', {
//             params: { 
//               emp_code: '', 
//               start_time: `${startDate} 00:00:00`, 
//               end_time: `${endDate} 23:59:59` 
//             },
//             headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
//           });
//           const transactions = Array.isArray(transactionsResp.data?.data) ? transactionsResp.data.data : (Array.isArray(transactionsResp.data) ? transactionsResp.data : []);

//           // Indexer pointages par emp_code et date
//           const punchesByEmpAndDate = {};
//           transactions.forEach(t => {
//             const code = String(t.emp_code || t.empId || t.emp || t.employee_id || '');
//             const punch = new Date(t.punch_time || t.time || t.checkin_time || t.punchTime || t.timestamp);
//             const dateKey = formatDate(punch);
            
//             if (!code) return;
//             if (!punchesByEmpAndDate[code]) punchesByEmpAndDate[code] = {};
//             if (!punchesByEmpAndDate[code][dateKey]) punchesByEmpAndDate[code][dateKey] = [];
            
//             punchesByEmpAndDate[code][dateKey].push(punch);
//           });

//           // Helpers
//           const isOnApprovedLeave = (empId, date) => {
//             const dateObj = new Date(date + 'T00:00:00');
//             return approvedLeaves.some(l => 
//               String(l.employe_id) === String(empId) && 
//               new Date(l.date_heure_depart) <= dateObj && 
//               new Date(l.date_heure_arrivee) >= dateObj
//             );
//           };

//           const getFirstPunchOfDay = (empCode, date) => {
//             const punches = punchesByEmpAndDate[empCode]?.[date] || [];
//             return punches.length > 0 ? punches.sort((a, b) => a - b)[0] : null;
//           };

//           const results = [];

//           // Générer les données pour chaque employé et chaque jour de la période
//           targetEmployees.forEach(emp => {
//             const empId = emp.id;
//             const empCode = String(emp.emp_code || emp.code || emp.empCode || '');
//             const deptId = String(emp.department?.id || emp.department_id || emp.dept_id || '');
//             const deptName = departmentIdToName[deptId] || emp.department?.dept_name || emp.department?.name || '';

//             // Parcourir chaque jour de la période
//             const currentDate = new Date(startDate);
//             const endDateObj = new Date(endDate);

//             while (currentDate <= endDateObj) {
//               const dateStr = formatDate(currentDate);
//               const dayKey = toDayKey(currentDate);

//               // Vérifier si l'employé est en permission/congé ce jour
//               if (isOnApprovedLeave(empId, dateStr)) {
//                 results.push({
//                   type: 'permission',
//                   employee_id: empId,
//                   emp_code: empCode,
//                   first_name: emp.first_name || emp.prenom || '',
//                   last_name: emp.last_name || emp.nom || '',
//                   department_id: deptId,
//                   department_name: deptName,
//                   date: dateStr,
//                   planned_time: null,
//                   actual_time: null,
//                   late_minutes: 0,
//                   planned_minutes: 0,
                  
//                 });
//                 currentDate.setDate(currentDate.getDate() + 1);
//                 continue;
//               }

//               // Récupérer les intervalles planifiés pour cet employé ce jour
//               let intervals = [];
//               plannings.forEach(p => {
//                 const start = new Date(p.semaine_debut);
//                 const end = new Date(p.semaine_fin);
//                 if (currentDate < start || currentDate > end) return;

//                 const dayIntervals = Array.isArray(p.jours_selectionnes?.[dayKey]) ? p.jours_selectionnes[dayKey] : [];
//                 dayIntervals.forEach(intv => {
//                   const assignedList = Array.isArray(intv.employes) ? intv.employes.map(String) : [];
//                   const topLevelAssigned = Array.isArray(p.employes) ? p.employes.map(String) : [];
//                   const deptAssigned = Array.isArray(p.departements) ? p.departements.map(String) : [];

//                   const isAssigned = (assignedList.length > 0 && assignedList.includes(String(empId)))
//                     || (assignedList.length === 0 && (topLevelAssigned.includes(String(empId)) || deptAssigned.includes(deptId)));

//                   if (isAssigned && intv.debut && intv.fin && intv.type !== 'repos') {
//                     intervals.push({ debut: intv.debut, fin: intv.fin });
//                   }
//                 });
//               });

//               if (intervals.length === 0) {
//                 // Non planifié: pas de données pour ce jour
//                 currentDate.setDate(currentDate.getDate() + 1);
//                 continue;
//               }

//               // Premier pointage de la journée
//               const firstPunch = empCode ? getFirstPunchOfDay(empCode, dateStr) : null;

//               // Calcul des statistiques
//               let totalPlannedMinutes = 0;
//               let totalLateMinutes = 0;
//               let plannedStartTime = null;

//               intervals.forEach(intv => {
//                 const schedStart = parseTimeToDate(currentDate, intv.debut);
//                 const schedEnd = parseTimeToDate(currentDate, intv.fin);
//                 totalPlannedMinutes += Math.max(0, Math.round((schedEnd - schedStart) / 60000));

//                 if (!plannedStartTime || schedStart < plannedStartTime) {
//                   plannedStartTime = schedStart;
//                 }

//                 if (firstPunch) {
//                   totalLateMinutes += diffMinutes(firstPunch, schedStart);
//                 }
//               });

//               // Déterminer le type et créer l'entrée
//               let itemType = 'presence';
//               let actualTime = null;
//               let lateMinutes = 0;

//               if (!firstPunch) {
//                 itemType = 'absence';
//                 lateMinutes = 0;
//               } else {
//                 actualTime = firstPunch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
//                 if (totalLateMinutes > 0) {
//                   itemType = 'retard';
//                   lateMinutes = totalLateMinutes;
//                 }
//               }

//               results.push({
//                 type: itemType,
//                 employee_id: empId,
//                 emp_code: empCode,
//                 first_name: emp.first_name || emp.prenom || '',
//                 last_name: emp.last_name || emp.nom || '',
//                 department_id: deptId,
//                 department_name: deptName,
//                 date: dateStr,
//                 planned_time: plannedStartTime ? plannedStartTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null,
//                 actual_time: actualTime,
//                 late_minutes: lateMinutes,
//                 planned_minutes: totalPlannedMinutes,
//               });

//               currentDate.setDate(currentDate.getDate() + 1);
//             }
//           });

//           // Trier par date puis par nom d'employé
//           results.sort((a, b) => {
//             if (a.date !== b.date) return a.date.localeCompare(b.date);
//             return (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name);
//           });

//           res.json(results);
//         } catch (apiErr) {
//           console.error('Erreur lors du calcul de ponctualité:', apiErr.message);
//           res.status(500).json({ error: 'Erreur lors de la récupération des données externes' });
//         }
//       });
//     });
//   } catch (error) {
//     console.error('Erreur interne:', error);
//     res.status(500).json({ error: 'Erreur interne du serveur' });
//   }
// };

// module.exports = { getPonctualiteReport };
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
  const [hh, mm, ss] = (timeStr || '00:00:00').split(':');
  const d = new Date(baseDate);
  d.setHours(Number(hh || 0), Number(mm || 0), Number(ss || 0), 0);
  return d;
}

function diffMinutes(lateDate, scheduledDate) {
  return Math.max(0, Math.round((lateDate - scheduledDate) / 60000));
}

// GET /api/v1/ponctualite?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=employee|department&employeeId=...&departmentId=...
const getPonctualiteReport = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  let { startDate, endDate, type, employeeId, departmentId } = req.query;

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
          departments.forEach(d => { 
            if (d && d.id) departmentIdToName[String(d.id)] = d.dept_name || d.name || String(d.id); 
          });

          // 2) Transactions de présence pour déterminer la période par défaut
          const transactionsResp = await axios.get('http://54.37.15.111:80/iclock/api/transactions/', {
            params: { emp_code: '' },
            headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
          });

          const transactions = Array.isArray(transactionsResp.data?.data) ? transactionsResp.data.data : 
                              (Array.isArray(transactionsResp.data) ? transactionsResp.data : []);

          if (!startDate || !endDate) {
            if (transactions.length > 0) {
              const firstPunch = transactions.reduce((min, t) => {
                const d = new Date(t.punch_time);
                return d < min ? d : min;
              }, new Date());
              startDate = formatDate(firstPunch);
              endDate = formatDate(new Date());
            } else {
              startDate = formatDate(new Date());
              endDate = formatDate(new Date());
            }
          }

          // 3) Filtrer les employés
          let targetEmployees = [];
          if (type === 'employee' && employeeId) {
            targetEmployees = employees.filter(emp => String(emp.id) === String(employeeId));
          } else if (type === 'department' && departmentId) {
            targetEmployees = employees.filter(emp => String(emp.department?.id || emp.department_id || emp.dept_id) === String(departmentId));
          } else {
            targetEmployees = employees; // par défaut → tous les employés
          }

          if (targetEmployees.length === 0) {
            return res.json([]);
          }

          // 4) Charger plannings
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

          // 5) Charger permissions/congés
          const startOfPeriod = new Date(startDate + 'T00:00:00');
          const endOfPeriod = new Date(endDate + 'T23:59:59');

          const approvedLeaves = await new Promise((resolve) => {
            const q = `SELECT * FROM permission_conge WHERE statut = 'approuve' AND date_heure_depart <= ? AND date_heure_arrivee >= ?`;
            connection.query(q, [endOfPeriod, startOfPeriod], (lerr, lrows) => {
              if (lerr) return resolve([]);
              resolve(lrows || []);
            });
          });

          // 6) Transactions filtrées par date
          const transactionsPeriodResp = await axios.get('http://54.37.15.111:80/iclock/api/transactions/', {
            params: { 
              emp_code: '', 
              start_time: `${startDate} 00:00:00`, 
              end_time: `${endDate} 23:59:59` 
            },
            headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
          });
          const transactionsPeriod = Array.isArray(transactionsPeriodResp.data?.data) ? transactionsPeriodResp.data.data : 
                                    (Array.isArray(transactionsPeriodResp.data) ? transactionsPeriodResp.data : []);

          // Indexer pointages
          const punchesByEmpAndDate = {};
          transactionsPeriod.forEach(t => {
            const code = String(t.emp_code || t.empId || t.emp || t.employee_id || '');
            const punch = new Date(t.punch_time || t.time || t.checkin_time || t.punchTime || t.timestamp);
            const dateKey = formatDate(punch);
            
            if (!code) return;
            if (!punchesByEmpAndDate[code]) punchesByEmpAndDate[code] = {};
            if (!punchesByEmpAndDate[code][dateKey]) punchesByEmpAndDate[code][dateKey] = [];
            
            punchesByEmpAndDate[code][dateKey].push({ punch, punchObj: t });
          });

          const getFirstPunchOfDay = (empCode, date) => {
            const punches = punchesByEmpAndDate[empCode]?.[date] || [];
            return punches.length > 0 ? punches.sort((a, b) => a.punch - b.punch)[0] : null;
          };

          const getFirstTransactionOfDay = (empCode, date) => {
            const punches = punchesByEmpAndDate[empCode]?.[date] || [];
            if (punches.length === 0) return null;
            return punches.sort((a, b) => a.punch - b.punch)[0].punchObj;
          };

          const isOnApprovedLeave = (empId, date) => {
            const dateObj = new Date(date + 'T00:00:00');
            return approvedLeaves.some(l => 
              String(l.employe_id) === String(empId) && 
              new Date(l.date_heure_depart) <= dateObj && 
              new Date(l.date_heure_arrivee) >= dateObj
            );
          };

          const results = [];

          // Générer le rapport
          targetEmployees.forEach(emp => {
            const empId = emp.id;
            const empCode = String(emp.emp_code || emp.code || emp.empCode || '');
            const deptId = String(emp.department?.id || emp.department_id || emp.dept_id || '');
            const deptName = departmentIdToName[deptId] || emp.department?.dept_name || emp.department?.name || '';

            const currentDate = new Date(startDate);
            const endDateObj = new Date(endDate);

            while (currentDate <= endDateObj) {
              const dateStr = formatDate(currentDate);
              const dayKey = toDayKey(currentDate);

              if (isOnApprovedLeave(empId, dateStr)) {
                results.push({
                  type: 'permission',
                  employee_id: empId,
                  emp_code: empCode,
                  first_name: emp.first_name || emp.prenom || '',
                  last_name: emp.last_name || emp.nom || '',
                  department_id: deptId,
                  department_name: deptName,
                  date: dateStr,
                  planned_time: null,
                  actual_time: null,
                  late_minutes: 0,
                  planned_minutes: 0,
                });
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
              }

              let intervals = [];
              plannings.forEach(p => {
                const start = new Date(p.semaine_debut);
                const end = new Date(p.semaine_fin);
                if (currentDate < start || currentDate > end) return;

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
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
              }

              const firstPunch = empCode ? getFirstPunchOfDay(empCode, dateStr) : null;
              const firstTransaction = empCode ? getFirstTransactionOfDay(empCode, dateStr) : null;

              let totalPlannedMinutes = 0;
              let totalLateMinutes = 0;
              let plannedStartTime = null;

              intervals.forEach(intv => {
                const schedStart = parseTimeToDate(currentDate, intv.debut);
                const schedEnd = parseTimeToDate(currentDate, intv.fin);
                totalPlannedMinutes += Math.max(0, Math.round((schedEnd - schedStart) / 60000));

                if (!plannedStartTime || schedStart < plannedStartTime) {
                  plannedStartTime = schedStart;
                }

                if (firstPunch) {
                  totalLateMinutes += diffMinutes(firstPunch.punch, schedStart);
                }
              });

              let itemType = 'presence';
              let actualTime = null;
              let lateMinutes = 0;

              if (!firstPunch) {
                itemType = 'absence';
              } else {
                actualTime = firstPunch.punch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                if (totalLateMinutes > 0) {
                  itemType = 'retard';
                  lateMinutes = totalLateMinutes;
                }
              }

              results.push({
                type: itemType,
                employee_id: empId,
                emp_code: empCode,
                first_name: emp.first_name || emp.prenom || '',
                last_name: emp.last_name || emp.nom || '',
                department_id: deptId,
                department_name: deptName,
                date: dateStr,
                planned_time: plannedStartTime ? plannedStartTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null,
                actual_time: actualTime,
                late_minutes: lateMinutes,
                planned_minutes: totalPlannedMinutes,

                // Champs bruts du premier pointage
                punch_time: firstTransaction?.punch_time || null,
                punch_state: firstTransaction?.punch_state || null,
                verify_type: firstTransaction?.verify_type || null,
                work_code: firstTransaction?.work_code || null,
                terminal_sn: firstTransaction?.terminal_sn || null,
                terminal_alias: firstTransaction?.terminal_alias || null,
                area_alias: firstTransaction?.area_alias || null,
                longitude: firstTransaction?.longitude || null,
                latitude: firstTransaction?.latitude || null,
                gps_location: firstTransaction?.gps_location || null,
                mobile: firstTransaction?.mobile || null,
                source: firstTransaction?.source || null,
                purpose: firstTransaction?.purpose || null,
                crc: firstTransaction?.crc || null,
                is_attendance: firstTransaction?.is_attendance || null,
                reserved: firstTransaction?.reserved || null,
                upload_time: firstTransaction?.upload_time || null,
                sync_status: firstTransaction?.sync_status || null,
                sync_time: firstTransaction?.sync_time || null,
                temperature: firstTransaction?.temperature || null,
              });

              currentDate.setDate(currentDate.getDate() + 1);
            }
          });

          results.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name);
          });

          res.json(results);
        } catch (apiErr) {
          console.error('Erreur lors du calcul de ponctualité:', apiErr.message);
          res.status(500).json({ error: 'Erreur lors de la récupération des données externes' });
        }
      });
    });
  } catch (error) {
    console.error('Erreur interne:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

module.exports = { getPonctualiteReport };
