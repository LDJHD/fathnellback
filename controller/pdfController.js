// controller/pdfController.js

const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const pdf = require('html-pdf');

// Fonction pour générer et télécharger le PDF
const generatePDFController = (req, res) => {
    // Charger le modèle HTML
    const templateHtml = fs.readFileSync(path.join(__dirname, '../templates/template.html'), 'utf8');

    // Compiler le modèle avec Handlebars
    const template = handlebars.compile(templateHtml);

    // Données dynamiques (à récupérer de req.query ou req.body)
    const data = {
        title: 'Mon Document',
        message: 'Voici un document généré dynamiquement avec Handlebars et html-pdf.',
        items: ['Élément 1', 'Élément 2', 'Élément 3']
    };

    // Rendre le modèle avec les données
    const html = template(data);

    // Options pour le PDF
    const options = { format: 'A4' };

    // Chemin de sortie du PDF
    const outputPath = path.join(__dirname, '../public/pdfs/output.pdf');

    // Générer le PDF
    pdf.create(html, options).toFile(outputPath, (err) => {
        if (err) {
            console.error('Erreur lors de la génération du PDF :', err);
            return res.status(500).send('Erreur lors de la génération du PDF');
        }

        // Envoyer le PDF au client après un court délai pour s'assurer qu'il est généré
        setTimeout(() => {
            res.download(outputPath);
        }, 1000); // Ajustez le délai selon vos besoins
    });
};

module.exports = { generatePDFController };
