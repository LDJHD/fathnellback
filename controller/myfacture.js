const { connecter } = require("./bd/connect");
const PDFDocument = require('pdfkit');
const fs = require('fs');

// Fonction pour créer une facture et générer un PDF
const createInvoice = async (req, res) => {
    try {
        // Extraction des données du corps de la requête
        const { name, price, quantity, taxGroup, format } = req.body;

        // Calcul du prix total
        const totalPrice = price * quantity;

        // Données de la facture à insérer dans la base de données
        const invoice = {
            name,
            price,
            quantity,
            taxGroup,
            totalPrice,
            created_at: new Date(),
            updated_at: new Date(),
        };

        // Insérer la facture dans la base de données
        connecter((error, connection) => {
            if (error) {
                return res.status(500).json({ error: "Erreur de connexion à la base de données" });
            }

            connection.query('INSERT INTO invoices SET ?', invoice, (err, result) => {
                if (err) {
                    return res.status(500).json({ error: "Erreur lors de l'ajout de la facture" });
                }

                // Génération du PDF avec PDFKit
                const doc = new PDFDocument({ size: format === 'A3' ? 'A3' : 'A4' });
                const pdfPath = `./invoices/invoice_${result.insertId}.pdf`;
                doc.pipe(fs.createWriteStream(pdfPath));

                // Ajouter des détails de la facture dans le PDF
                doc.fontSize(20).text('Facture DGI', { align: 'center' });
                doc.text(`Produit: ${name}`, 100, 150);
                doc.text(`Prix: ${price}`, 100, 180);
                doc.text(`Quantité: ${quantity}`, 100, 210);
                doc.text(`Groupe Taxe: ${taxGroup}`, 100, 240);
                doc.text(`Prix Total: ${totalPrice}`, 100, 270);

                doc.end(); // Terminer la génération du PDF

                return res.status(200).json({
                    message: "Facture créée avec succès",
                    invoiceId: result.insertId,
                    pdfPath
                });
            });
        });
    } catch (error) {
        console.error("Erreur serveur :", error);
        return res.status(500).json({ error: "Erreur du serveur" });
    }
};

module.exports = { createInvoice };

