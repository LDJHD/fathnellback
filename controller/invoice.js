const { connecter } = require("../bd/connect");
const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const printer = require('pdf-to-printer');
const QRCode = require('qrcode');
const qrcode = require('qrcode');
const path = require('path');




// Remplace ces valeurs par tes vraies informations
const API_URL = 'https://developper.impots.bj/sygmef-emcf/api';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6IjMyMDIzOTc5MDQ5NjF8VFMwMTAxMDU5NyIsInJvbGUiOiJUYXhwYXllciIsIm5iZiI6MTczNTIxMzM3MiwiZXhwIjoxNzY2NzAzNjAwLCJpYXQiOjE3MzUyMTMzNzIsImlzcyI6ImltcG90cy5iaiIsImF1ZCI6ImltcG90cy5iaiJ9.QZFIFQQr6Z2Ocn4_MromVbe52ohoW9EXeYE0-SyBXIs'; // Ton token API
const IFU = '3202397904961'; // Ton IFU

// Fonction pour créer une facture
const postInvoiceRequestDto = async (req, res) => {
  const {cAIB,cHT,cTTC,cTVA, format, ifu,aib,type, client, items, operator,payment } = req.body; // Destructure the incoming request body

  const invoiceRequestDto = {
    format,
    ifu,
    type,
    client,
    items,       // Already an array from req.body
    operator,    // Already an object from req.body
    ...(aib === "A" || aib === "B" ? { aib } : {}),
  };
  

  try {
    // Assuming you want to send the invoice data to an external service, otherwise you could just save it in the DB
    const response = await axios.post(`${API_URL}/invoice`, invoiceRequestDto, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
console.log(response)
    const { uid } = response.data;
    const format = req.body.format;

    const datee = await generateInvoicePDFsimple(cAIB,cHT,cTTC,cTVA,aib,format, items, client, payment, operator);

    const invoiceId = await createInvoice({
      cAIB, cHT, cTTC, cTVA, aib, format, items, client, operator, payment, ifu, type, 
      qrCode: response.data.qrCode, 
      codeMECeFDGI: response.data.codeMECeFDGI,
      counters: response.data.counters, 
      nim: response.data.nim, 
      refundWithAibPayment: response.data.refundWithAibPayment
    });

    if (uid) {
      console.log("Invoice created successfully, UID:", uid);
      // Call a function to get invoice details if needed
      await getInvoiceDetailsDto(cAIB,cHT,cTTC,cTVA,aib,format, uid, res, items);  // Ensure this function is defined
      return res.status(201).json({ message: "Invoice created successfully", uid, format,datee,invoiceId });
    } else {
      return res.status(400).json({ message: "Invoice creation failed" });
    }
  } catch (error) {
    console.error("Error creating invoice:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

const postInvoiceRequestDtosimple = async (req, res) => {
  const { cAIB,cHT,cTTC,cTVA, format, ifu,aib, type, client, items, operator,payment } = req.body; // Destructure the incoming request body



  try {
    // Assuming you want to send the invoice data to an external service, otherwise you could just save it in the DB
   
    const format = req.body.format;

    const datee = await generateInvoicePDFsimple(cAIB,cHT,cTTC,cTVA,aib,format, items, client, payment, operator);

   
      return res.status(201).json({ message: "Invoice created successfully",format,datee });
   
  } catch (error) {
    console.error("Error creating invoice:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Fonction pour créer une facture et générer un PDF
// const createInvoice = async (req, res) => {
//   try {
//     // Extraction des données du corps de la requête
//     const { name, price, quantity, taxGroup, format } = req.body;

//     // Calcul du prix total
//     const totalPrice = price * quantity;

//     // Données de la facture à insérer dans la base de données
//     const invoice = {
//       ifu,
//       type,
//       items,
//       client,
//       operator,
//       payment,
//       qrCode,
//       codeMECeFDGI,
//       counters,
//       nim,
//       refundWithAibPayment,
//       created_at: new Date(),
//       updated_at: new Date(),
//     };


//     // Insérer la facture dans la base de données
//     connecter((error, connection) => {
//       if (error) {
//         return res.status(500).json({ error: "Erreur de connexion à la base de données" });
//       }

//       connection.query('INSERT INTO invoices SET ?', invoice, (err, result) => {
//         if (err) {
//           return res.status(500).json({ error: "Erreur lors de l'ajout de la facture" });
//         }

//         // Génération du PDF avec PDFKit
//         const doc = new PDFDocument({ size: format === 'A3' ? 'A3' : 'A4' });
//         const pdfPath = `./invoices/invoice_${result.insertId}.pdf`;
//         doc.pipe(fs.createWriteStream(pdfPath));

//         // Ajouter des détails de la facture dans le PDF
//         doc.fontSize(20).text('Facture DGI', { align: 'center' });
//         doc.text(`Produit: ${name}`, 100, 150);
//         doc.text(`Prix: ${price}`, 100, 180);
//         doc.text(`Quantité: ${quantity}`, 100, 210);
//         doc.text(`Groupe Taxe: ${taxGroup}`, 100, 240);
//         doc.text(`Prix Total: ${totalPrice}`, 100, 270);

//         doc.end(); // Terminer la génération du PDF

//         return res.status(200).json({
//           message: "Facture créée avec succès",
//           invoiceId: result.insertId,
//           pdfPath
//         });
//       });
//     });
//   } catch (error) {
//     console.error("Erreur serveur :", error);
//     return res.status(500).json({ error: "Erreur du serveur" });
//   }
// };



// Fonction pour récupérer les détails de la facture
const getInvoiceDetailsDto = async (cAIB,cHT,cTTC,cTVA,aib,format, uid, res, items) => {
  try {
    const response = await axios.get(`${API_URL}/invoice/${uid}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    console.log("InvoiceDetailsDto:", response.data);
    // Finaliser la facture après avoir récupéré les détails
    putFinalize(cAIB,cHT,cTTC,cTVA,aib,format, uid, response.data, res, items);
  } catch (error) {
    console.error("Error fetching invoice details:", error.message);
    return res.status(500).json({ message: "Error fetching invoice details", error: error.message });
  }
};


const putFinalize = async (cAIB,cHT,cTTC,cTVA,aib,format, uid, invoiceDetails, res, items) => {
  try {
    // Finalisation de la facture
    const response = await axios.put(`${API_URL}/invoice/${uid}/confirm`, {}, {
      headers: { Authorization: `Bearer ${API_TOKEN}` },
    });

    console.log("Response de l'API :", response.data);

    const { qrCode, codeMECeFDGI, counters, nim, refundWithAibPayment } = response.data;
    if (!qrCode) {
      return res.status(400).json({ message: "QR code non trouvé dans la réponse" });
    }

        // Création de l'enregistrement de la facture dans la base de données
    const invoiceData = {
      cAIB, cHT, cTTC, cTVA, aib, format,
      items, 
      client: invoiceDetails.client, 
      operator: invoiceDetails.operator, 
      payment: invoiceDetails.payment, 
      ifu: invoiceDetails.ifu, 
      type: invoiceDetails.type,
      qrCode,
      codeMECeFDGI,
      counters,
      nim,
      refundWithAibPayment
    };

    const InvoiceId=await createInvoice(invoiceData, res); // Enregistrer la facture


    console.log("QR Code récupéré :", qrCode);

    // Générer le PDF après la finalisation
    const filePath = await generateInvoicePDF(cAIB,cHT,cTTC,cTVA,aib,uid, response.data, invoiceDetails, format, qrCode, items).catch((error) => {
      console.error("Erreur lors de la génération du PDF :", error.message);
      // Si le PDF échoue, renvoyer la réponse une seule fois
      if (!res.headersSent) {
        return res.status(500).json({ message: "Erreur lors de la génération du PDF", error: error.message });
      }
    });

    if (!res.headersSent && filePath) {
      const publicPath = `/factures/facture_${uid}.pdf`; // Chemin public accessible au frontend
      return res.status(200).json({
        message: "Invoice finalized, PDF generated successfully",
        filePath: publicPath,
        InvoiceId, 
      });
    }

  } catch (error) {
    console.error("Erreur lors de la finalisation de la facture:", error.message);

    // Vérifier si la réponse a déjà été envoyée pour éviter l'erreur "headers already sent"
    if (!res.headersSent) {
      return res.status(500).json({ message: "Error finalizing invoice", error: error.message });
    }
  }
};


// const putFinalize = async (cAIB, cHT, cTTC, cTVA, aib, format, uid, invoiceDetails, res, items) => {
//   try {
//     // Finalisation de la facture
//     const response = await axios.put(`${API_URL}/invoice/${uid}/confirm`, {}, {
//       headers: { Authorization: `Bearer ${API_TOKEN}` },
//     });

//     console.log("Response de l'API :", response.data);

//     const { qrCode, codeMECeFDGI, counters, nim, refundWithAibPayment } = response.data;
//     if (!qrCode) {
//       return res.status(400).json({ message: "QR code non trouvé dans la réponse" });
//     }

//     console.log("QR Code récupéré :", qrCode);

//     // Création de l'enregistrement de la facture dans la base de données
//     const invoiceData = {
//       cAIB, cHT, cTTC, cTVA, aib, format,
//       items, 
//       client: invoiceDetails.client, 
//       operator: invoiceDetails.operator, 
//       payment: invoiceDetails.payment, 
//       ifu: invoiceDetails.ifu, 
//       type: invoiceDetails.type,
//       qrCode,
//       codeMECeFDGI,
//       counters,
//       nim,
//       refundWithAibPayment
//     };

//     await createInvoice(invoiceData, res); // Enregistrer la facture

//   } catch (error) {
//     console.error("Erreur lors de la finalisation de la facture:", error.message);
//     if (!res.headersSent) {
//       return res.status(500).json({ message: "Error finalizing invoice", error: error.message });
//     }
//   }
// };


const postInvoiceRequestDtoAvoir = async (req, res) => {
  const { ifu,aib,type, client, items, operator,payment } = req.body; // Destructure the incoming request body

  const invoiceRequestDto = {
    format,
    ifu,
    type,
    client,
    items,       // Already an array from req.body
    operator,
    payment,    // Already an object from req.body
    ...(aib === "A" || aib === "B" ? { aib } : {}),
  };
  

  try {
    // Assuming you want to send the invoice data to an external service, otherwise you could just save it in the DB
    const response = await axios.post(`${API_URL}/invoice`, invoiceRequestDto, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
console.log(response)
    const { uid } = response.data;
    // const format = req.body.format;

    // const datee = await generateInvoicePDFsimple(cAIB,cHT,cTTC,cTVA,aib,format, items, client, payment, operator);

    // const invoiceId = await createInvoice({
    //   cAIB, cHT, cTTC, cTVA, aib, format, items, client, operator, payment, ifu, type, 
    //   qrCode: response.data.qrCode, 
    //   codeMECeFDGI: response.data.codeMECeFDGI,
    //   counters: response.data.counters, 
    //   nim: response.data.nim, 
    //   refundWithAibPayment: response.data.refundWithAibPayment
    // });

    if (uid) {
      console.log("Invoice created successfully, UID:", uid);
      // Call a function to get invoice details if needed
      // await getInvoiceDetailsDto(cAIB,cHT,cTTC,cTVA,aib,format, uid, res, items);  // Ensure this function is defined
      return res.status(201).json({ message: "Invoice created successfully", uid });
    } else {
      return res.status(400).json({ message: "Invoice creation failed" });
    }
  } catch (error) {
    console.error("Error creating invoice:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



const createInvoice = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const { cAIB, cHT, cTTC, cTVA, aib, format, items, client, operator, payment, ifu, type, qrCode, codeMECeFDGI, counters, nim, refundWithAibPayment } = data;

      const invoice = {
        ifu,
        type,
        items: JSON.stringify(items),
        client: JSON.stringify(client),
        operator: JSON.stringify(operator),
        payment: JSON.stringify(payment),
        qrCode,
        codeMECeFDGI,
        counters,
        nim,
        refundWithAibPayment,
        created_at: new Date(),
        updated_at: new Date(),
      };

      connecter((error, connection) => {
        if (error) {
          reject("Erreur de connexion à la base de données");
        }

        connection.query('INSERT INTO invoice SET ?', invoice, (err, result) => {
          if (err) {
            reject("Erreur lors de l'ajout de la facture");
          }

          resolve(result.insertId); // Resolve with the inserted invoice ID
        });
      });
    } catch (error) {
      reject("Erreur du serveur");
    }
  });
};








// const createInvoice = async (data, res) => {
//   try {
//     // Extraction des données reçues
//     const { cAIB, cHT, cTTC, cTVA, aib, format, items, client, operator, payment, ifu, type, qrCode, codeMECeFDGI, counters, nim, refundWithAibPayment } = data;

//     // Données de la facture à insérer dans la base de données
//     const invoice = {
//       ifu,
//       type,
//       items: JSON.stringify(items),
//       client: JSON.stringify(client),
//       operator: JSON.stringify(operator),
//       payment: JSON.stringify(payment),
//       qrCode,
//       codeMECeFDGI,
//       counters,
//       nim,
//       refundWithAibPayment,
//       created_at: new Date(),
//       updated_at: new Date(),
//     };

//     // Connexion à la base de données et insertion de la facture
//     connecter((error, connection) => {
//       if (error) {
//         if (!res.headersSent) {
//           return res.status(500).json({ error: "Erreur de connexion à la base de données" });
//         }
//       }

//       connection.query('INSERT INTO invoice SET ?', invoice, (err, result) => {
//         if (err) {
//           if (!res.headersSent) {
//             return res.status(500).json({ error: "Erreur lors de l'ajout de la facture" });
//           }
//         }

//         // Retourner l'ID de la facture insérée
//         if (!res.headersSent) {
//           return res.status(200).json({
//             message: "Enregistrement créé avec succès",
//             invoiceId: result.insertId,  // ID de la facture insérée
//           });
//         }
//       });
//     });

//   } catch (error) {
//     console.error("Erreur serveur :", error);
//     if (!res.headersSent) {
//       return res.status(500).json({ error: "Erreur du serveur" });
//     }
//   }
// };




const generateInvoicePDF = async (cAIB,cHT,cTTC,cTVA,aib,uid, responseapi, invoiceDetails, format, qrCodeUrl, items) => {
  // Définir le format du document (A3 ou A4)

  console.log(format);
  if (format === 'A3') {
    const doc = new PDFDocument({ size: 'A3', margin: 30 });

    // Chemins relatifs pour les fichiers
    const fontRegularPath = path.join(__dirname, '../fonts/Poppins-Regular.ttf');
    const fontBoldPath = path.join(__dirname, '../fonts/Poppins-Bold.ttf');
    const logoPath = path.join(__dirname, '../logo.png');
    const outputDir = path.join(__dirname, '../factures');
    const filePath = path.join(outputDir, `facture_${uid}.pdf`);

    // Assurez-vous que le dossier de sortie existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Formater la date et l'heure
    const dateTime = responseapi.dateTime; // Format attendu : "YYYY-MM-DD HH:MM:SS"

    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Ajouter les polices personnalisées
    doc.registerFont('Poppins', fontRegularPath);
    doc.registerFont('Poppins-Bold', fontBoldPath);

    // Créer le fichier PDF
    doc.pipe(fs.createWriteStream(filePath));

    // ====================== En-tête ======================
    doc.image(logoPath, 30, 30, { width: 80 }) // Logo
      .font('Poppins-Bold')
      .fontSize(12)
      .text('ATON HELIOSTORE', 30, 30, { align: 'center', underline: true })
      .fontSize(10)
      .text('Fidjrossè centre', 30, 60, { align: 'center' })
      .text('Tél: 229 97377399 - Emaild: superelim@gmail.com', 30, 75, { align: 'center' })
      .text('IFU: 3202397094961 - RCCM: RB/COT/23 B 34278', 30, 90, { align: 'center' });

    if (qrCodeUrl) {
      try {
        const qrCodeImage = await qrcode.toDataURL(qrCodeUrl);
        doc.image(qrCodeImage, 720, 30, { width: 100 }, { align: 'center' });
      } catch (err) {
        console.error("Erreur lors de la génération du QR code :", err.message);
      }
    }

    // ====================== Informations de la facture ======================
    doc.fillColor('#000')
      .font('Poppins-Bold')
      .fontSize(10)
      .text(`FACTURE N°: ${invoiceDetails.type}${uid}`, 30, 170, { align: 'left' })
      .text(`Date: ${responseapi.dateTime}`, 30, 182)
      .text(`Client: ${invoiceDetails.client?.name || ' '}`, 30, 192)
      .text(`IFU: ${invoiceDetails.client?.ifu || ' '}`, 30, 202)
      .text(`Tél: ${invoiceDetails.client?.contact || ' '}`, 30, 214)
      .text(`Adresse: ${invoiceDetails.client?.address || ' '}`, 30, 228);

    console.log(items);

    // Ajout des informations supplémentaires alignées à droite
    doc.fontSize(7)
      .font('Poppins')
      .text(`Code MECeF/DGI3 : ${responseapi.codeMECeFDGI}`, 390, 194, { align: 'right' })
      .text(`NIM : ${responseapi.nim}`, 390, 204, { align: 'right' })
      .text(`Compteur : ${responseapi.counters}`, 390, 214, { align: 'right' })
      .text(`Heure : ${responseapi.dateTime}`, 390, 228, { align: 'right' });

    // Ligne de séparation
    doc.moveTo(30, 240).lineTo(800, 240).stroke('#D3D3D3');

    // ====================== Tableau des articles ======================
    const tableTop = 250;
    const tableColumnWidths = [220, 200, 200, 130];
    const tableHeaders = ['Libellé', 'Quantité', 'Prix Unitaire', 'Montant'];

    // Dessiner l'arrière-plan grisé de l'en-tête
    doc.rect(30, tableTop, 800, 20).fill('#F5F5F5');

    // Ajouter les en-têtes
    doc.font('Poppins-Bold').fillColor('#000').fontSize(10);
    tableHeaders.forEach((header, index) => {
      doc.text(header, 30 + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0), tableTop + 5, { width: tableColumnWidths[index], align: 'left' });
    });

    // Contenu
    const itemSpacing = 20;
    let currentY = tableTop + 25; // Position initiale après l'en-tête
    doc.font('Poppins').fillColor('#000');

    items.forEach((item) => {
      const { name, quantity, unit, price } = item;

      const rowData = [
        name || 'N/A',
        `${quantity} ${unit || ''}`, // Combine quantité et unité
        `${parseFloat(price) || 0}`, // Formate le prix en nombre décimal
        `${(parseFloat(price) * parseInt(quantity)) || 0}`, // Calcule le total
      ];

      // Écriture de chaque donnée dans le PDF
      rowData.forEach((data, index) => {
        doc.text(
          data,
          30 + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0), // Position horizontale
          currentY, // Position verticale
          { width: tableColumnWidths[index], align: 'left' } // Largeur et alignement
        );
      });

      currentY += itemSpacing; // Incrémente la position verticale après chaque ligne
    });

    // ====================== Totaux ======================

    // Infos complémentaires
    // Initialisation des coordonnées pour positionner les textes
    let paymentY = currentY + 20;
    doc.font('Poppins')
    // Parcours des modes de paiement et affichage des détails
    invoiceDetails.payment.forEach((payment) => {
      const { name, amount } = payment; // Extraction des propriétés
      doc.font('Poppins-Bold')
      .text(`Mode de paiement: ${name}`, 30, paymentY,{ align: 'right' })
      .text(`Total: ${amount} Fcfa`, 30, paymentY + 14,{ align: 'right' })
      .text(` Reliquat: ${amount} Fcfa`, 30, paymentY + 26,{ align: 'right' })
      .text(`Total HT (B):  ${cTVA !== 0 ? cHT : 0} Fcfa`, 30, paymentY )
      .text(`TVA,18% (B):  ${cTVA} Fcfa`, 30, paymentY + 14)
      .text(`Total (B): ${cTVA !== 0 ? cTTC : 0} Fcfa`, 30, paymentY + 26)
      .text(`Total Exonéré(A ex): ${amount} Fcfa`, 30, paymentY + 39)
      .text(` AIB ${aib}%: ${cAIB} Fcfa`, 30, paymentY + 52);
      paymentY += 10; // Ajuste la position verticale pour le prochain mode de paiement
    });
    doc.text(`Vendeur: ${invoiceDetails.operator.name} `, 30, paymentY + 64);
    // ====================== Signature ======================
    doc.text('Le Directeur Général', 30, paymentY + 82)
      .font('Poppins')
      .text(invoiceDetails.director || 'Non renseigné', 30, paymentY + 94);

  
      
    doc
    .font('Poppins-Bold') // Assurez-vous d'avoir une version en gras de la police
    .fontSize(10) // Ajuste la taille de la police
    .text(
      'Merci de votre visite ! Nous apprécions votre confiance et espérons vous revoir bientôt. N\'hésitez pas à nous faire part de votre expérience. À très bientôt !', 30, currentY + 150
      ,{ align: 'left' });
  

    doc.end();
    console.log(`PDF généré avec succès : ${filePath}`);
    return filePath;
  } else if (format === 'Ticket') {
    const doc = new PDFDocument({ size: [220, 800], margin: 10 }); // Format ticket compact

    const fontRegularPath = path.join(__dirname, '../fonts/Poppins-Regular.ttf');
    const fontBoldPath = path.join(__dirname, '../fonts/Poppins-Bold.ttf');
    const logoPath = path.join(__dirname, '../logo.png');
    const outputDir = path.join(__dirname, '../factures');
    const filePath = path.join(outputDir, `facture_${uid}.pdf`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    doc.registerFont('Poppins', fontRegularPath);
    doc.registerFont('Poppins-Bold', fontBoldPath);

    doc.pipe(fs.createWriteStream(filePath));

    // Logo
    doc.image(logoPath, 175, 10, { width: 40 }); // Centrer le logo en haut

    // Informations sur l'entreprise
    doc
      .font('Poppins-Bold')
      .fontSize(8)
      .text('ATON HELIOSTORE', { align: 'left', underline: true })
      .moveDown(0.3)
      .fontSize(6)
      .text('Fidjrossè centre', { align: 'left' })
      .text('Tél: 229 97377399 - Email: superelim@gmail.com', { align: 'left' })
      .text('IFU: 3202397094961', { align: 'left' })
      .text('RCCM: RB/COT/23 B 34278', { align: 'left' });

    doc.moveDown(1);

    // Informations sur le ticket et le client
    doc
      .font('Poppins')
      .fontSize(6)
      .text(`Ticket N°: ${invoiceDetails.type}${uid}`, { align: 'left' })
      .text(`Date: ${responseapi.dateTime}`, { align: 'left' })
      .text(`Client: ${invoiceDetails.client?.name || ' '}`, { align: 'left' })
      .text(`IFU Client: ${invoiceDetails.client?.ifu || ' '}`, { align: 'left' })
      .text(`Adresse: ${invoiceDetails.client?.address || ' '}`, { align: 'left' })
      .text(`Tel: ${invoiceDetails.client?.contact || ' '}`, { align: 'left' });

    doc.moveDown(1);

// En-tête horizontal du tableau
const tableHeaders = ['Désignations', 'Qté', 'Prix', 'Montants'];
const tableColumnWidths = [90, 20, 50, 50]; // Largeurs ajustées

// Dessiner l'en-tête du tableau
doc.rect(10, 140, 200, 15).fill('#F5F5F5').stroke(); // Fond pour l'en-tête
tableHeaders.forEach((header, index) => {
  const headerX = tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0);

  doc
    .font('Poppins-Bold')
    .fontSize(8)
    .fillColor('#000')
    .text(header, headerX, 142 , {
      width: tableColumnWidths[index],
      align: 'center', // Alignement centré
    });
});
doc.moveDown(1);

// Contenu du tableau sans bordures
items.forEach((item) => {
  const { name, quantity, price } = item;

  const rowData = [
    name || 'N/A', // Libellé
    `${quantity}`, // Qtés
    `${Math.floor(price) || '0'}`, // Prix unitaire (arrondi sans décimales)
    `${Math.floor(price * quantity) || '0'}`, // Montant (arrondi sans décimales)
  ];

  const startY = doc.y;

  rowData.forEach((data, index) => {
    const cellX = 10 + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0);
    const cellWidth = tableColumnWidths[index];

    // Texte sans bordures
    doc.font('Poppins-Regular')
      .fontSize(8)
      .fillColor('#000')
      .text(data, cellX + 2, startY + 3, {
        width: cellWidth - 4, // Espacement
        align: index === 0 ? 'left' : 'center', // Alignement
      });
  });

  doc.y += 15; // Ligne suivante
});

// Mode de paiement et informations additionnelles
let paymentY = doc.y + 5; // Espacement
invoiceDetails.payment.forEach((payment) => {

      const { name, amount } = payment;

      doc.font('Poppins-Bold')
        .fontSize(6)
        .text(`Mode de paiement : ${name}`, 10,paymentY,{ align: 'right' })
        .text(`Total : ${Math.floor(amount)} Fcfa`, 10,paymentY+10,{ align: 'right' } ) // Montant sans décimales
        .text(` Reliquat: 0 `, 10, paymentY + 20,{ align: 'right' })
        .text(`Total HT (B): ${cTVA !== 0 ? cHT : 0} Fcfa`, 10, paymentY )
        .text(`TVA,18% (B): ${cTVA} Fcfa`, 10, paymentY + 10)
        .text(`Total (B): ${cTVA !== 0 ? cTTC : 0} Fcfa`, 10, paymentY + 20)
        .text(`Total Exonéré(A ex): ${Math.floor(amount)} Fcfa`, 10, paymentY + 30)
        .text(` AIB ${aib}%: ${cAIB} Fcfa`, 10, paymentY + 40);
    });
    
    // Signature
    const currentY = doc.y;
    doc.text(`Vendeur : ${invoiceDetails.operator.name || 'Non renseigné'}`, 10,  doc.y )
      .text('Le Directeur Général', 10,  doc.y )
      .font('Poppins')
      .text(invoiceDetails.director || 'Non renseigné', 10,  doc.y);

      doc
    .font('Poppins-Bold') // Assurez-vous d'avoir une version en gras de la police
    .fontSize(5) // Ajuste la taille de la police
    .text(
      'Merci de votre visite ! Nous apprécions votre confiance et espérons vous revoir bientôt. N\'hésitez pas à nous faire part de votre expérience. À très bientôt !', 10,doc.y+20
      ,{ align: 'left' });
    
    
     // Informations additionnelles
     doc
     .font('Poppins')
     .fontSize(6)
     .text(`Code MECeF/DGI : ${responseapi.codeMECeFDGI}`, 10, doc.y+30, { align: 'left' })
     .text(`NIM : ${responseapi.nim}`, { align: 'left' })
     .text(`Compteurs : ${responseapi.counters}`, { align: 'left' })
     .text(`Heure : ${responseapi.dateTime}`, { align: 'left' });



    // QR Code
    if (qrCodeUrl) {
      try {
        const qrCodeImage = await qrcode.toDataURL(qrCodeUrl);
        doc.image(qrCodeImage, 140, doc.y + 10, { width: 80, align: 'right' }); // Centrer le QR code
      } catch (err) {
        console.error('Erreur lors de la génération du QR code :', err.message);
      }
    }

    doc.moveDown(3);
    
    doc.end();

    console.log(`Ticket généré avec succès : ${filePath}`);
    return filePath;
  }
  else {

    const doc = new PDFDocument({ size: 'A4', margin: 30 });

    // Chemins relatifs pour les fichiers
    const fontRegularPath = path.join(__dirname, '../fonts/Poppins-Regular.ttf');
    const fontBoldPath = path.join(__dirname, '../fonts/Poppins-Bold.ttf');
    const logoPath = path.join(__dirname, '../logo.png');
    const outputDir = path.join(__dirname, '../factures');
    const filePath = path.join(outputDir, `facture_${uid}.pdf`);

    // Assurez-vous que le dossier de sortie existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Formater la date et l'heure
    const dateTime = responseapi.dateTime; // Format attendu : "YYYY-MM-DD HH:MM:SS"

    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Ajouter les polices personnalisées
    doc.registerFont('Poppins', fontRegularPath);
    doc.registerFont('Poppins-Bold', fontBoldPath);

    // Créer le fichier PDF
    doc.pipe(fs.createWriteStream(filePath));

    // ====================== En-tête ======================
    doc.image(logoPath, 30, 30, { width: 80 }) // Logo
      .font('Poppins-Bold')
      .fontSize(12)
      .text('ATON HELIOSTORE', 30, 30, { align: 'center', underline: true })
      .fontSize(10)
      .text('Fidjrossè centre', 30, 60, { align: 'center' })
      .text('Tél: 229 97377399 - Email: superelim@gmail.com', 30, 75, { align: 'center' })
      .text('IFU: 3202397094961 - RCCM: RB/COT/23 B 34278', 30, 90, { align: 'center' });

    if (qrCodeUrl) {
      try {
        const qrCodeImage = await qrcode.toDataURL(qrCodeUrl);
        doc.image(qrCodeImage, 479, 30, { width: 100 }, { align: 'center' });
      } catch (err) {
        console.error("Erreur lors de la génération du QR code :", err.message);
      }
    }

    // ====================== Informations de la facture ======================
    doc.fillColor('#000')
      .font('Poppins-Bold')
      .fontSize(8)
      .text(`FACTURE N°: ${invoiceDetails.type}${uid}`, 30, 170, { align: 'left' })
      .text(`Date: ${responseapi.dateTime}`, 30, 182)
      .text(`Client: ${invoiceDetails.client?.name || ' '}`, 30, 192)
      .text(`IFU: ${invoiceDetails.client?.ifu || ' '}`, 30, 202)
      .text(`Tél: ${invoiceDetails.client?.contact || ' '}`, 30, 214)
      .text(`Adresse: ${invoiceDetails.client?.address || ' '}`, 30, 228);

    // Ajout des informations supplémentaires alignées à droite
    doc.fontSize(8)
      .font('Poppins')
      .text(`Code MECeF/DGIa4 : ${responseapi.codeMECeFDGI}`, 390, 180, { align: 'right' })
      .text(`NIM : ${responseapi.nim}`, 390, 204, { align: 'right' })
      .text(`Compteur : ${responseapi.counters}`, 390, 214, { align: 'right' })
      .text(`Heure : ${responseapi.dateTime}`, 390, 228, { align: 'right' });

    // Ligne de séparation
    doc.moveTo(30, 240).lineTo(560, 240).stroke('#D3D3D3');

    // ====================== Tableau des articles ======================
    const tableTop = 250;
    const tableColumnWidths = [220, 100, 100, 120];
    const tableHeaders = ['Libellé', 'Quantité', 'Prix Unitaire', 'Montant'];

    // Dessiner l'arrière-plan grisé de l'en-tête
    doc.rect(30, tableTop, 540, 20).fill('#F5F5F5');

    // Ajouter les en-têtes
    doc.font('Poppins-Bold').fillColor('#000').fontSize(10);
    tableHeaders.forEach((header, index) => {
      doc.text(header, 30 + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0), tableTop + 5, { width: tableColumnWidths[index], align: 'left' });
    });

    // Contenu
    const itemSpacing = 20;
    let currentY = tableTop + 25; // Position initiale après l'en-tête
    doc.font('Poppins').fillColor('#000');

    items.forEach((item) => {
      const { name, quantity, unit, price } = item;

      const rowData = [
        name || 'N/A',
        `${quantity} ${unit || ''}`, // Combine quantité et unité
        `${parseFloat(price) || 0}`, // Formate le prix en nombre décimal
        `${(parseFloat(price) * parseInt(quantity)) || 0}`, // Calcule le total
      ];

      // Écriture de chaque donnée dans le PDF
      rowData.forEach((data, index) => {
        doc.text(
          data,
          30 + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0), // Position horizontale
          currentY, // Position verticale
          { width: tableColumnWidths[index], align: 'left' } // Largeur et alignement
        );
      });

      currentY += itemSpacing; // Incrémente la position verticale après chaque ligne
    });

    // ====================== Totaux ======================

    // Infos complémentaires
    // Initialisation des coordonnées pour positionner les textes
    let paymentY = currentY + 20;
    doc.font('Poppins')
    // Parcours des modes de paiement et affichage des détails
    invoiceDetails.payment.forEach((payment) => {
      const { name, amount } = payment; // Extraction des propriétés
      doc.font('Poppins-Bold')
      .text(`Mode de paiement: ${name}`, 30, paymentY,{ align: 'right' })
      .text(`Total: ${amount} Fcfa`, 30, paymentY + 14,{ align: 'right' })
      .text(` Reliquat: ${amount} Fcfa`, 30, paymentY + 28,{ align: 'right' })
      .text(`Total HT (B):  ${cTVA !== 0 ? cHT : 0} Fcfa`, 30, paymentY )
      .text(`TVA,18% (B):  ${cTVA} Fcfa`, 30, paymentY + 14)
      .text(`Total (B): ${cTVA !== 0 ? cTTC : 0} Fcfa`, 30, paymentY + 26)
      .text(`Total Exonéré(A ex): ${amount} Fcfa`, 30, paymentY + 39)
      .text(` AIB ${aib}%: ${cAIB} Fcfa`, 30, paymentY + 52);
      paymentY += 10; // Ajuste la position verticale pour le prochain mode de paiement
    });
    doc.text(`Vendeur: ${invoiceDetails.operator.name} `, 30, paymentY + 64);
    // ====================== Signature ======================
    doc.text('Le Directeur Général', 30, paymentY + 82)
      .font('Poppins')
      .text(invoiceDetails.director || 'Non renseigné', 30, paymentY + 94);

      doc
    .font('Poppins-Bold') // Assurez-vous d'avoir une version en gras de la police
    .fontSize(10) // Ajuste la taille de la police
    .text(
      'Merci de votre visite ! Nous apprécions votre confiance et espérons vous revoir bientôt. N\'hésitez pas à nous faire part de votre expérience. À très bientôt !', 30, currentY + 150
      ,{ align: 'left' });

    doc.end();
    console.log(`PDF généré avec succès : ${filePath}`);
    return filePath;

  }
};


// const generateInvoicePDFsimple = async (cAIB,cHT,cTTC,cTVA,aib,format, items, client, payment, operator) => {
//   const datee = new Date().toISOString().replace(/[:.]/g, '-');
//   const outputDir = path.join(__dirname, '../invoices');

//   // S'assurer que le dossier de sortie existe
//   if (!fs.existsSync(outputDir)) {
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   const filePaths = path.join(outputDir, `invoice_${datee}.pdf`);
//   const doc = new PDFDocument(
//     format === 'A3'
//       ? { size: 'A3', margin: 30 }
//       : format === 'A4'
//       ? { size: 'A4', margin: 20 }
//       : { size: [220, 800], margin: 10 }
//   );

//   // Fichiers
//   const fontRegularPath = path.join(__dirname, '../fonts/Poppins-Regular.ttf');
//   const fontBoldPath = path.join(__dirname, '../fonts/Poppins-Bold.ttf');
//   const logoPath = path.join(__dirname, '../logo.png');
//   const qrPath = path.join(__dirname, '../qr.png');

//   // Ajouter les polices
//   doc.registerFont('Poppins', fontRegularPath);
//   doc.registerFont('Poppins-Bold', fontBoldPath);

//   doc.pipe(fs.createWriteStream(filePaths));
// //les entetes
//   const x = format === 'A3' ? 30 : format === 'A4' ? 30 : 170;
//   const y = format === 'A3' ? 30 : format === 'A4' ? 30 : 10;
//   const width = format === 'A3' || format === 'A4' ? 80 : 40;

//   const xPositionn = format === 'Ticket' ? 10 : 30;
//   const yStartn = format === 'Ticket' ? 10 : 30; // Départ différent pour "Ticket"
//   const lineSpacingn = format === 'Ticket' ? 10 : 15; // Espacement plus compact pour "Ticket"
//   const alignText = format === 'Ticket' ? 'left' : 'center'; // Alignement dynamique

// doc.image(logoPath, x, y, { width })
//   .font('Poppins-Bold')
//   .fontSize(format === 'A3' ? 12 : format === 'A4' ? 12 : 8)
//   .text('ATON HELIOSTORE', xPositionn, yStartn, { align: alignText, underline: true })
//   .fontSize(format === 'A3' ? 10 : format === 'A4' ? 10 : 6)
//   .text('Fidjrossè centre', xPositionn, yStartn + lineSpacingn, { align: alignText })
//   .text('Tél: 229 97377399 - Email: superelim@gmail.com', xPositionn, yStartn + lineSpacingn * 2, { align: alignText })
//   .text('IFU: 3202397094961 - RCCM: RB/COT/23 B 34278', xPositionn, yStartn + lineSpacingn * 3, { align: alignText });


//   if (format === 'A3') doc.image(qrPath, 720, 30, { width: 100 });
//   if (format === 'A4') doc.image(qrPath, 500, 30, { width: 80 });
//   // if (format === 'Ticket') doc.image(qrPath, 150, 420, { width: 60 });

//   // ====================== INFO FACTURE ======================
//   const currentTime = new Date().toLocaleString();
//   const xPosition = format === 'Ticket' ? 10 : 30;
//   const yStart = format === 'Ticket' ? 80 : 170; // Départ différent pour "Ticket"
//   const lineSpacing = format === 'Ticket' ? 8 : 15;
  
//   doc.fillColor('#000')
//     .font('Poppins-Bold')
//     .fontSize(format === 'A3' ? 10 : format === 'A4' ? 8 : 6)
//     .text(`FACTURE N°: ${datee}`, xPosition, yStart)
//     .text(`Date: ${currentTime}`, xPosition, yStart + lineSpacing)
//     .text(`Client: ${client?.name || ' '}`, xPosition, yStart + lineSpacing * 2)
//     .text(`IFU: ${client?.ifu || ' '}`, xPosition, yStart + lineSpacing * 3)
//     .text(`Tél: ${client?.contact || ' '}`, xPosition, yStart + lineSpacing * 4)
//     .text(`Adresse: ${client?.address || ' '}`, xPosition, yStart + lineSpacing * 5);
  

//   // ====================== TABLEAU DES ARTICLES ======================
//   const tableTop = format==='Ticket'?150: 270;
//   const tableHeaders = ['Libellé', 'Quantité', 'Prix Unitaire', 'Montant'];
//   const tableColumnWidths =
//     format === 'A3' ? [220, 200, 200, 130] : format === 'A4' ? [180, 80, 120, 120] : [60, 50, 60, 50];
//     const xdebutbg = format === 'Ticket' ? 1 : 30;
//   doc.rect(xdebutbg, tableTop, format === 'A3' ? 800 : format === 'A4' ? 550 : 220, 20).fill('#F5F5F5'); // Fond en-tête
//   doc.font('Poppins-Bold').fillColor('#000').fontSize(format === 'A3' ? 10 : format === 'A4' ? 8 : 6);
//   const xdebutt = format === 'Ticket' ? 10 : 30;
//   tableHeaders.forEach((header, index) => {
//     doc.text(header, xdebutt + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0), tableTop + 5, {
//       width: tableColumnWidths[index],
//       align: 'left',
//     });
//   });

//   let currentY = tableTop + 25;
//   doc.font('Poppins').fillColor('#000');

//   items.forEach((item) => {
//     const { name, quantity, unit, price } = item;
//     const rowData = [
//       name || 'N/A',
//       `${quantity} ${unit || ''}`,
//       `${parseFloat(price) || 0}`,
//       `${(parseFloat(price) * parseInt(quantity)) || 0}`,
//     ];
//     const xdebut = format === 'Ticket' ? 10 : 30;
//     rowData.forEach((data, index) => {
//       doc.text(data, xdebut + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0), currentY, {
//         width: tableColumnWidths[index],
//         align: 'left',
//       });
//     });

//     currentY += 20;
//   });

//   // ====================== TOTALS & PAIEMENTS ======================
//   const xdebuttt = format === 'Ticket' ? 10 : 30;
//   const plus = format === 'Ticket' ? 10 : 20;

  
//   let paymentY = currentY + plus;
//   doc.font('Poppins');

//   if (format === 'Ticket') doc.image(qrPath, 150, paymentY+120, { width: 60 });

//   const { method, total } = payment;
//   doc.font('Poppins-Bold')
//     .text(`Mode de paiement: ${method}`, xdebuttt, paymentY,{ align: 'right' })
//     .text(`Total: ${total} Fcfa`, xdebuttt, paymentY + 12,{ align: 'right' })
//     .text(` Reliquat: 0 `, xdebuttt, paymentY + 22,{ align: 'right' })
//     .text(`Total HT (B): ${cTVA !== 0 ? cHT : 0} Fcfa`, xdebuttt, paymentY )
//     .text(`TVA,18% (B): ${cTVA} Fcfa`, xdebuttt, paymentY + 12)
//     .text(`Total (B): ${cTVA !== 0 ? cTTC : 0} Fcfa`, xdebuttt, paymentY + 22)
//     .text(`Total Exonéré(A ex): ${total} Fcfa`, xdebuttt, paymentY + 32)
//     .text(` AIB ${aib}%: ${cAIB} Fcfa`, xdebuttt, paymentY + 42);
   

//   doc.text(`Vendeur: ${operator.name}`, xdebuttt, paymentY + 52);

//   // ====================== SIGNATURE ======================
//   doc.text('Le Directeur Général', xdebuttt, paymentY + 62)
//     .font('Poppins')
//     .text('Nom du Directeur', xdebuttt, paymentY + 72);


//     const s = format === 'A3' ? 10 : format === 'A4' ? 9 : 5;

//     doc
//     .font('Poppins-Bold') // Assurez-vous d'avoir une version en gras de la police
//     .fontSize(s) // Ajuste la taille de la police
//     .text(
//       'Merci de votre visite ! Nous apprécions votre confiance et espérons vous revoir bientôt. N\'hésitez pas à nous faire part de votre expérience. À très bientôt !',xdebuttt, paymentY + 90
//       ,{ align: 'left' });
  

    

//   doc.end();
//   console.log(`PDF généré avec succès : ${filePaths}`);

//   return datee;
// };


const generateInvoicePDFsimple = async (cAIB,cHT,cTTC,cTVA,aib,format, items, client, payment, operator) => {
  const datee = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(__dirname, '../invoices');

  // S'assurer que le dossier de sortie existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePaths = path.join(outputDir, `invoice_${datee}.pdf`);
  const doc = new PDFDocument(
    format === 'A3'
      ? { size: 'A3', margins: { top: 50, bottom: 30, left: 50, right: 50 } }
      : format === 'A4'
      ? { size: 'A4', margins: { top: 50, bottom: 30, left: 50, right: 50 } }
      : { size: [220, 800], margin: 10 }
  );

  // Fichiers
  const fontRegularPath = path.join(__dirname, '../fonts/Poppins-Regular.ttf');
  const fontBoldPath = path.join(__dirname, '../fonts/Poppins-Bold.ttf');
  const fontsemiBoldPath = path.join(__dirname, '../fonts/Poppins-SemiBold.ttf');
  const logoPath = path.join(__dirname, '../logo.png');
  const qrPath = path.join(__dirname, '../qr.png');

  // Ajouter les polices
  doc.registerFont('Poppins', fontRegularPath);
  doc.registerFont('Poppins-Bold', fontBoldPath);
  doc.registerFont('Poppins-SemiBold', fontsemiBoldPath);

  doc.pipe(fs.createWriteStream(filePaths));
//les entetes
  const x = format === 'A3' ? 50 : format === 'A4' ? 50 : 170;
  const y = format === 'A3' ? 30 : format === 'A4' ? 30 : 10;
  const width = format === 'A3' || format === 'A4' ? 80 : 40;

  const xPositionn = format === 'Ticket' ? 10 : 50;
  const yStartn = format === 'Ticket' ? 10 : 30; // Départ différent pour "Ticket"
  const lineSpacingn = format === 'Ticket' ? 10 : 15; // Espacement plus compact pour "Ticket"
  const alignText = format === 'Ticket' ? 'left' : 'center'; // Alignement dynamique

doc.image(logoPath, x, y, { width })
  .font('Poppins-SemiBold')
  .fontSize(format === 'A3' ? 12 : format === 'A4' ? 12 : 8)
  .text('ATON HELIOSTORE', xPositionn, yStartn, { align: alignText })
  .fontSize(format === 'A3' ? 10 : format === 'A4' ? 10 : 6)
  .text('Fidjrossè centre', xPositionn, yStartn + lineSpacingn, { align: alignText })
  .text('Tél: 229 97377399 ', xPositionn, yStartn + lineSpacingn * 2, { align: alignText })
  .text('Email: superelim@gmail.com ', xPositionn, yStartn + lineSpacingn * 3, { align: alignText })
  .text('IFU: 3202397094961 - RCCM: RB/COT/23 B 34278', xPositionn, yStartn + lineSpacingn * 4, { align: alignText });


  if (format === 'A3') doc.image(qrPath, 670, 30, { width: 100 });
  if (format === 'A4') doc.image(qrPath, 470, 30, { width: 80 });
  // if (format === 'Ticket') doc.image(qrPath, 150, 420, { width: 50 });

  // ====================== INFO FACTURE ======================
  const currentTime = new Date().toLocaleString();
  const xPosition = format === 'Ticket' ? 10 : 50;
  const yStart = format === 'Ticket' ? 80 : 170; // Départ différent pour "Ticket"
  const lineSpacing = format === 'Ticket' ? 8 : 15;
  
  doc.fillColor('#000')
    .font('Poppins-SemiBold')
    .fontSize(format === 'A3' ? 10 : format === 'A4' ? 8 : 6)
    // .text(`FACTURE N°: ${datee}`, xPosition, yStart)
    doc.text(
      `FACTURE N°: ${
        new Date().getFullYear().toString()
        + String(new Date().getMonth() + 1).padStart(2, '0')
        + String(new Date().getDate()).padStart(2, '0')
        + String(new Date().getHours()).padStart(2, '0')
        + String(new Date().getMinutes()).padStart(2, '0')
        + String(new Date().getSeconds()).padStart(2, '0')
      }`,
      xPosition,
      yStart
    )
    .text(`Date: ${currentTime}`, xPosition, yStart + lineSpacing)
    .text(`Client: ${client?.name || ' '}`, xPosition, yStart + lineSpacing * 2)
    .text(`IFU: ${client?.ifu || ' '}`, xPosition, yStart + lineSpacing * 3)
    .text(`Tél: ${client?.contact || ' '}`, xPosition, yStart + lineSpacing * 4)
    .text(`Adresse: ${client?.address || ' '}`, xPosition, yStart + lineSpacing * 5);
  

  // ====================== TABLEAU DES ARTICLES ======================
  const tableTop = format==='Ticket'?150: 270;
  const tableHeaders = ['Libellé', 'Quantité', 'Prix Unitaire', 'Montant'];
  const tableColumnWidths =
    format === 'A3' ? [220, 200, 200, 130] : format === 'A4' ? [180, 80, 120, 120] : [50, 50, 50, 50];
    const xdebutbg = format === 'Ticket' ? 1 : 50;
  doc.rect(xdebutbg, tableTop, format === 'A3' ? 750 : format === 'A4' ? 500 : 220, 20).fill('#F5F5F5'); // Fond en-tête
  doc.font('Poppins-Bold').fillColor('#000').fontSize(format === 'A3' ? 10 : format === 'A4' ? 8 : 6);
  const xdebutt = format === 'Ticket' ? 10 : 50;
  tableHeaders.forEach((header, index) => {
    doc.text(header, xdebutt + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0), tableTop + 5, {
      width: tableColumnWidths[index],
      align: 'left',
    });
  });

  let currentY = tableTop + 25;
  doc.font('Poppins').fillColor('#000');

  items.forEach((item) => {
    const { name, quantity, unit, price } = item;
    const rowData = [
      name || 'N/A',
      `${quantity} ${unit || ''}`,
      `${parseFloat(price) || 0}`,
      `${(parseFloat(price) * parseInt(quantity)) || 0}`,
    ];
    const xdebut = format === 'Ticket' ? 10 : 50;
    rowData.forEach((data, index) => {
      doc.text(data, xdebut + tableColumnWidths.slice(0, index).reduce((a, b) => a + b, 0), currentY, {
        width: tableColumnWidths[index],
        align: 'left',
      });
    });

    currentY += 20;
  });

  // ====================== TOTALS & PAIEMENTS ======================
  const xdebuttt = format === 'Ticket' ? 10 : 50;
  const plus = format === 'Ticket' ? 10 : 20;

  
  let paymentY = currentY +5+ plus;
  doc.font('Poppins');

  if (format === 'Ticket') doc.image(qrPath, 150, paymentY+150, { width: 50 });

  const { method, total } = payment;
  doc.font('Poppins-SemiBold')
    .text(`Mode de paiement: ${method}`, xdebuttt, paymentY,{ align: 'right' })
    .text(`Total: ${total} Fcfa`, xdebuttt, paymentY + 14,{ align: 'right' })
    .text(` Reliquat: 0 `, xdebuttt, paymentY + 26,{ align: 'right' })
    .text(`Total HT (B): ${cTVA !== 0 ? cHT : 0} Fcfa`, xdebuttt, paymentY )
    .text(`TVA,18% (B): ${cTVA} Fcfa`, xdebuttt, paymentY + 14)
    .text(`Total (B): ${cTVA !== 0 ? cTTC : 0} Fcfa`, xdebuttt, paymentY + 28)
    .text(`Total Exonéré(A ex): ${total} Fcfa`, xdebuttt, paymentY + 40)
    .text(` AIB ${aib}%: ${cAIB} Fcfa`, xdebuttt, paymentY + 52);
   

  doc.text(`Vendeur: ${operator.name}`, xdebuttt, paymentY + 62);

  // ====================== SIGNATURE ======================
  doc.text('Le Directeur Général', xdebuttt, paymentY + 72)
    .font('Poppins')
    .text('Nom du Directeur', xdebuttt, paymentY + 82);


    const s = format === 'A3' ? 10 : format === 'A4' ? 9 : 5;

    doc
    .font('Poppins-SemiBold') // Assurez-vous d'avoir une version en gras de la police
    .fontSize(s) // Ajuste la taille de la police
    .text(
      'Merci de votre visite ! Nous apprécions votre confiance et espérons vous revoir bientôt. N\'hésitez pas à nous faire part de votre expérience. À très bientôt !',xdebuttt, paymentY + 120
      ,{ align: 'left' });
  

    

  doc.end();
  console.log(`PDF généré avec succès : ${filePaths}`);

  return datee;
};


// const statistiqueComptabilitePdf = (req, res) => {
//   try {
//     const data = req.body;
    
//     const getValue = (key) => data[key] ?? 0;
    
//     const doc = new PDFDocument({ size: "A4", margin: 50 });
//     const datee = new Date().toISOString().replace(/[:.]/g, "-");
//     const outputPath = `pdf/${datee}_statistiques_comptabilite.pdf`;
    
//     const stream = fs.createWriteStream(outputPath);
//     doc.pipe(stream);

//     // 📌 TITRE PRINCIPAL
//     doc.fontSize(18).text("Statistiques Comptabilité", { align: "center" }).moveDown(2);

//     // 📌 TABLEAU : STATISTIQUES
//     const table1 = [
//       ["Catégorie", "Valeur"],
//       ["Total Enregistrements Défaut", getValue("totalEnregistrementDefaut")],
//       ["Total Montant Défaut", getValue("totalMontantDefaut")],
//       ["Ce Jour", getValue("ceJour")],
//       ["7 Derniers Jours", getValue("septJour")],
//       ["30 Derniers Jours", getValue("trenteDerniersJours")],
//     ];
//     drawTable(doc, table1);

//     doc.end();

//     stream.on("finish", () => {
//       res.status(200).json({ message: "PDF généré avec succès", url: outputPath });
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Échec de la génération du PDF", error: error.message });
//   }
// };

// const drawTable = (doc, data) => {
//   const startX = 50;
//   let startY = doc.y;
//   const colWidths = [250, 200];
//   const rowHeight = 25;

//   data.forEach((row) => {
//     let x = startX;
//     row.forEach((cell, j) => {
//       doc.rect(x, startY, colWidths[j], rowHeight).stroke();
//       doc.text(String(cell), x + 5, startY + 8, { width: colWidths[j] - 10, align: "center" });
//       x += colWidths[j];
//     });
//     startY += rowHeight;
//     if (startY + rowHeight > 750) {
//       doc.addPage();
//       startY = 50;
//     }
//   });
//   doc.moveDown(2);
// };

const statistiqueComptabilitePdf = (req, res) => {
  try {
    const data = req.body;

    // Fonction pour récupérer la valeur ou 0 si la donnée est manquante
    const getValue = (key) => data[key] ?? 0;

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const datee = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = `pdf/${datee}_statistiques_comptabilite.pdf`;

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // 📌 TITRE PRINCIPAL
    doc.fontSize(18).text("Statistiques Comptabilité", { align: "center" }).moveDown(2);

    // 📌 TABLEAU : STATISTIQUES
    const table1 = [
      ["Catégorie", "Valeur"],
      ["Nombre des factures", getValue("totalEnregistrementDefaut")],
      ["Exonérés", getValue("totalMontantDefaut")],
      ["Taxable", 0],
      ["Régime d'exception", 0],
      ["Régime TPS", 0],  // Valeur par défaut à 0
      ["Taxable", 0],   // Valeur par défaut à 0
      ["Réservés", 0],  // Valeur par défaut à 0
      ["Total (2+3+4+5+6+7)", 0],  // Valeur par défaut à 0
    ];

    // Dessiner le premier tableau
    drawTable(doc, table1);

    // 📌 Deuxième tableau (même structure)
    const table2 = [
      ["Catégorie", "Valeur"],
      ["Ce Jour", getValue("ceJour")],
      ["7 Derniers Jours", getValue("septJour")],
      ["30 Derniers Jours", getValue("trenteDerniersJours")],
      ["Montant réservé", 0],  // Valeur par défaut à 0
      ["Sous total", 0],  // Valeur par défaut à 0
      ["TVA taxables 18%", 0],   // Valeur par défaut à 0
      ["TVA exportation 18%", 0],  // Valeur par défaut à 0
      ["Total Montant Défaut", getValue("totalMontantDefaut")],
    ];

    // Décalage pour le deuxième tableau (ajuster en fonction de l'espace)
    const startY = doc.y + 10;  // Décalage pour ne pas écraser le premier tableau
    doc.y = startY;

    // Dessiner le deuxième tableau
    drawTable(doc, table2);

    doc.end();

    stream.on("finish", () => {
      res.status(200).json({
        message: "PDF généré avec succès",
        url: `${req.protocol}://${req.get('host')}/pdf/${datee}_statistiques_comptabilite.pdf`, // URL complète
        datee,
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Échec de la génération du PDF", error: error.message });
  }
};

const drawTable = (doc, data) => {
  const startX = 50;
  let startY = doc.y;
  const colWidths = [250, 200];
  const rowHeight = 25;

  data.forEach((row) => {
    let x = startX;
    row.forEach((cell, j) => {
      doc.rect(x, startY, colWidths[j], rowHeight).stroke();
      doc.text(String(cell), x + 5, startY + 8, { width: colWidths[j] - 10, align: "center" });
      x += colWidths[j];
    });
    startY += rowHeight;
    if (startY + rowHeight > 750) {
      doc.addPage();
      startY = 50;
    }
  });
  doc.moveDown(2);
};













const printPDF = async (filePath, printerName = "HP Laser Jet P1102") => {
  try {
    // Imprime le document PDF avec le module printer
    await printer.print(filePath, { printer: printerName }); // Nom de l'imprimante
    console.log("Document imprimé avec succès.");
    return { success: true, message: "Document imprimé avec succès." };
  } catch (error) {
    console.error("Erreur lors de l'impression du document :", error.message);
    return { success: false, message: "Erreur lors de l'impression du document", error: error.message };
  }
};


// Exportation des fonctions
module.exports = {
  postInvoiceRequestDto,
  getInvoiceDetailsDto,
  generateInvoicePDF,
  putFinalize,
  createInvoice,
  statistiqueComptabilitePdf,
  postInvoiceRequestDtosimple,
}; 