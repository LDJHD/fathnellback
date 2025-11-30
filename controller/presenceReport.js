const axios = require('axios');
const { connecter } = require('../bd/connect');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./emailService');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur pour les pièces jointes
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'contacttoconnect01@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'twohjvzdnypydige'
  }
});

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

function formatTime(mins) {
  if (!mins || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// POST /api/v1/generate-presence-report
const generatePresenceReport = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ error: 'Utilisateur non authentifié' });
  }

  const { period, clientId } = req.body;

  if (!period) {
    return res.status(400).json({ error: 'Période requise' });
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
          // Calculer les dates selon la période
          const endDate = new Date();
          let startDate = new Date();

          switch (period) {
            case 'today':
              startDate = new Date(endDate);
              startDate.setHours(0, 0, 0, 0);
              break;
            case '7days':
              startDate.setDate(endDate.getDate() - 7);
              break;
            case '30days':
              startDate.setDate(endDate.getDate() - 30);
              break;
            case '12months':
              startDate.setMonth(endDate.getMonth() - 12);
              break;
            default:
              return res.status(400).json({ error: 'Période invalide' });
          }

          const startDateStr = formatDate(startDate);
          const endDateStr = formatDate(endDate);

          // Récupérer les clients
          let clients = [];
          if (clientId) {
            // Client spécifique
            clients = await new Promise((resolve, reject) => {
              connection.query('SELECT * FROM client WHERE id = ?', [clientId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
              });
            });
          } else {
            // Tous les clients
            clients = await new Promise((resolve, reject) => {
              connection.query('SELECT * FROM client WHERE email IS NOT NULL AND email != ""', (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
              });
            });
          }

          if (clients.length === 0) {
            return res.status(404).json({ error: 'Aucun client trouvé' });
          }

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

          // 3) Charger permissions/congés approuvés pour la période
          const startOfPeriod = new Date(startDateStr + 'T00:00:00');
          const endOfPeriod = new Date(endDateStr + 'T23:59:59');

          const approvedLeaves = await new Promise((resolve) => {
            const q = `SELECT * FROM permission_conge WHERE statut = 'approuve' AND date_heure_depart <= ? AND date_heure_arrivee >= ?`;
            connection.query(q, [endOfPeriod, startOfPeriod], (lerr, lrows) => {
              if (lerr) return resolve([]);
              resolve(lrows || []);
            });
          });

          // 4) Charger transactions de présence pour la période
          const transactionsResp = await axios.get('http://54.37.15.111:80/iclock/api/transactions/', {
            params: { 
              emp_code: '', 
              start_time: `${startDateStr} 00:00:00`, 
              end_time: `${endDateStr} 23:59:59` 
            },
            headers: { 'Authorization': `Token ${userToken}`, 'Content-Type': 'application/json' },
          });
          const transactions = Array.isArray(transactionsResp.data?.data) ? transactionsResp.data.data : (Array.isArray(transactionsResp.data) ? transactionsResp.data : []);

          // Indexer pointages par emp_code et date
          const punchesByEmpAndDate = {};
          transactions.forEach(t => {
            const code = String(t.emp_code || t.empId || t.emp || t.employee_id || '');
            const punch = new Date(t.punch_time || t.time || t.checkin_time || t.punchTime || t.timestamp);
            const dateKey = formatDate(punch);
            
            if (!code) return;
            if (!punchesByEmpAndDate[code]) punchesByEmpAndDate[code] = {};
            if (!punchesByEmpAndDate[code][dateKey]) punchesByEmpAndDate[code][dateKey] = [];
            
            punchesByEmpAndDate[code][dateKey].push(punch);
          });

          // Helpers
          const isOnApprovedLeave = (empId, date) => {
            const dateObj = new Date(date + 'T00:00:00');
            return approvedLeaves.some(l => 
              String(l.employe_id) === String(empId) && 
              new Date(l.date_heure_depart) <= dateObj && 
              new Date(l.date_heure_arrivee) >= dateObj
            );
          };

          const getFirstPunchOfDay = (empCode, date) => {
            const punches = punchesByEmpAndDate[empCode]?.[date] || [];
            return punches.length > 0 ? punches.sort((a, b) => a - b)[0] : null;
          };

          // Générer les données de rapport
          const reportData = [];

          employees.forEach(emp => {
            const empId = emp.id;
            const empCode = String(emp.emp_code || emp.code || emp.empCode || '');
            const deptId = String(emp.department?.id || emp.department_id || emp.dept_id || '');
            const deptName = departmentIdToName[deptId] || emp.department?.dept_name || emp.department?.name || '';

            // Parcourir chaque jour de la période
            const currentDate = new Date(startDate);
            const endDateObj = new Date(endDate);

            while (currentDate <= endDateObj) {
              const dateStr = formatDate(currentDate);
              const dayKey = toDayKey(currentDate);

              // Vérifier si l'employé est en permission/congé ce jour
              if (isOnApprovedLeave(empId, dateStr)) {
                reportData.push({
                  type: 'permission',
                  employee_id: empId,
                  emp_code: empCode,
                  first_name: emp.first_name || emp.prenom || '',
                  last_name: emp.last_name || emp.nom || '',
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

              // Récupérer les intervalles planifiés pour cet employé ce jour
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
                // Non planifié: pas de données pour ce jour
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
              }

              // Premier pointage de la journée
              const firstPunch = empCode ? getFirstPunchOfDay(empCode, dateStr) : null;

              // Calcul des statistiques
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
                  totalLateMinutes += diffMinutes(firstPunch, schedStart);
                }
              });

              // Déterminer le type et créer l'entrée
              let itemType = 'presence';
              let actualTime = null;
              let lateMinutes = 0;

              if (!firstPunch) {
                itemType = 'absence';
                lateMinutes = 0;
              } else {
                actualTime = firstPunch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                if (totalLateMinutes > 0) {
                  itemType = 'retard';
                  lateMinutes = totalLateMinutes;
                }
              }

              reportData.push({
                type: itemType,
                employee_id: empId,
                emp_code: empCode,
                first_name: emp.first_name || emp.prenom || '',
                last_name: emp.last_name || emp.nom || '',
                department_name: deptName,
                date: dateStr,
                planned_time: plannedStartTime ? plannedStartTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null,
                actual_time: actualTime,
                late_minutes: lateMinutes,
                planned_minutes: totalPlannedMinutes,
              });

              currentDate.setDate(currentDate.getDate() + 1);
            }
          });

          // Générer le PDF
          const doc = new PDFDocument({ margin: 50 });
          const filename = `rapport_presence_${startDateStr}_${endDateStr}.pdf`;
          const filepath = path.join(__dirname, '../temp', filename);

          // Créer le dossier temp s'il n'existe pas
          const tempDir = path.dirname(filepath);
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const stream = fs.createWriteStream(filepath);
          doc.pipe(stream);

          // En-tête du PDF
          doc.fontSize(24)
             .font('Helvetica-Bold')
             .fillColor('#1e40af')
             .text('Rapport de Présence', { align: 'center' });

          doc.moveDown(0.5);
          doc.fontSize(14)
             .font('Helvetica')
             .fillColor('#374151')
             .text(`Période : ${startDateStr} au ${endDateStr}`, { align: 'center' });

          doc.moveDown(0.5);
          doc.fontSize(12)
             .text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });

          doc.moveDown(2);

          // Statistiques générales
          const total = reportData.length;
          const presences = reportData.filter(item => item.type === 'presence').length;
          const retards = reportData.filter(item => item.type === 'retard').length;
          const absences = reportData.filter(item => item.type === 'absence').length;
          const permissions = reportData.filter(item => item.type === 'permission').length;

          doc.fontSize(16)
             .font('Helvetica-Bold')
             .fillColor('#1e40af')
             .text('Statistiques Générales');

          doc.moveDown(0.5);
          doc.fontSize(12)
             .font('Helvetica')
             .fillColor('#374151');

          const statsY = doc.y;
          doc.text(`Total des jours : ${total}`, 50, statsY);
          doc.text(`Présences : ${presences}`, 200, statsY);
          doc.text(`Retards : ${retards}`, 350, statsY);
          doc.text(`Absences : ${absences}`, 500, statsY);
          doc.text(`Permissions/Congés : ${permissions}`, 50, statsY + 20);

          doc.moveDown(3);

          // Tableau détaillé
          doc.fontSize(16)
             .font('Helvetica-Bold')
             .fillColor('#1e40af')
             .text('Détails par Employé');

          doc.moveDown(1);

          // En-têtes du tableau
          const tableY = doc.y;
          const colWidths = [80, 100, 80, 80, 80, 80];
          const colX = [50, 130, 230, 310, 390, 470];

          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor('#ffffff')
             .rect(50, tableY, 500, 25)
             .fill();

          doc.fillColor('#1e40af')
             .text('Date', colX[0], tableY + 8)
             .text('Employé', colX[1], tableY + 8)
             .text('Département', colX[2], tableY + 8)
             .text('Type', colX[3], tableY + 8)
             .text('Heure prévue', colX[4], tableY + 8)
             .text('Heure réelle', colX[5], tableY + 8);

          let currentY = tableY + 35;

          // Données du tableau
          reportData.slice(0, 50).forEach((item, index) => { // Limiter à 50 lignes pour éviter les pages trop longues
            if (currentY > 700) {
              doc.addPage();
              currentY = 50;
            }

            const rowColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
            doc.fillColor(rowColor)
               .rect(50, currentY, 500, 20)
               .fill();

            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#374151')
               .text(new Date(item.date).toLocaleDateString('fr-FR'), colX[0], currentY + 5)
               .text(`${item.first_name} ${item.last_name}`, colX[1], currentY + 5)
               .text(item.department_name, colX[2], currentY + 5)
               .text(item.type === 'presence' ? 'Présent' : item.type === 'retard' ? 'Retard' : item.type === 'absence' ? 'Absent' : 'Permission', colX[3], currentY + 5)
               .text(item.planned_time || '-', colX[4], currentY + 5)
               .text(item.actual_time || '-', colX[5], currentY + 5);

            currentY += 25;
          });

          doc.end();

          // Attendre que le fichier soit écrit
          stream.on('finish', async () => {
            try {
              // Envoyer le PDF par email aux clients
              for (const client of clients) {
                if (client.email) {
                  try {
                    const clientName = `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Client';
                    const subject = `📊 Rapport de Présence - ${startDateStr} au ${endDateStr}`;
                    const html = getPresenceReportEmailTemplate(clientName, startDateStr, endDateStr);
                    
                    console.log(`📧 Envoi d'email à: ${client.email}`);
                    await sendEmailWithAttachment(client.email, subject, html, filepath, filename);
                    console.log(`✅ Email envoyé avec succès à ${client.email}`);
                  } catch (emailError) {
                    console.error(`❌ Erreur lors de l'envoi à ${client.email}:`, emailError);
                  }
                } else {
                  console.log(`⚠️ Client ${client.id} n'a pas d'email configuré`);
                }
              }

              // Envoyer le PDF au client
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
              fs.createReadStream(filepath).pipe(res);

              // Nettoyer le fichier temporaire après un délai
              setTimeout(() => {
                if (fs.existsSync(filepath)) {
                  fs.unlinkSync(filepath);
                }
              }, 60000); // 1 minute

            } catch (emailError) {
              console.error('Erreur lors de l\'envoi des emails:', emailError);
              // Envoyer quand même le PDF
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
              fs.createReadStream(filepath).pipe(res);
            }
          });

        } catch (apiErr) {
          console.error('Erreur lors de la génération du rapport:', apiErr.message);
          res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
        }
      });
    });
  } catch (error) {
    console.error('Erreur interne:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Fonction pour envoyer un email avec pièce jointe PDF
const sendEmailWithAttachment = async (to, subject, html, attachmentPath, filename) => {
  try {
    const mailOptions = {
      from: `"fatnelle - Rapports" <${process.env.GMAIL_USER || 'contacttoconnect01@gmail.com'}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: filename,
          path: attachmentPath,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email avec PDF envoyé avec succès à:', to);
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email avec PDF:', error);
    throw error;
  }
};

// Template pour l'email de rapport de présence
const getPresenceReportEmailTemplate = (clientName, startDate, endDate) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">📊 Rapport de Présence</h1>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
            Bonjour <strong>${clientName}</strong>,
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin: 0;">
            Veuillez trouver ci-joint le rapport de présence pour la période du <strong>${startDate}</strong> au <strong>${endDate}</strong>.
          </p>
        </div>
        
        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #2c3e50; margin-top: 0;">📋 Contenu du rapport :</h3>
          <ul style="color: #34495e; line-height: 1.8;">
            <li>Statistiques de présence par employé</li>
            <li>Détails des retards et absences</li>
            <li>Permissions et congés approuvés</li>
            <li>Résumé par département</li>
          </ul>
        </div>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <p style="color: #155724; margin: 0; font-size: 14px;">
            <strong>📎 Pièce jointe :</strong> Le rapport PDF est attaché à cet email.
          </p>
        </div>
        
        <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
          <p style="color: #7f8c8d; font-size: 14px; text-align: center; margin: 0;">
            L'équipe fatnelle<br>
            Gestion des présences
          </p>
        </div>
      </div>
    </div>
  `;
};

module.exports = { generatePresenceReport };
