const Jimp = require('jimp');
const jsQR = require('jsqr');
const NodeWebcam = require('node-webcam');

// Configuration pour le scanner QR code
const webcamOptions = {
    width: 1280,
    height: 720,
    quality: 100,
    delay: 0,
    saveShots: true,
    output: 'jpeg',
    device: false,
    callbackReturn: 'location',
    verbose: false
};

// Fonction pour capturer une image à partir de la webcam
const captureImage = async (path) => {
    return new Promise((resolve, reject) => {
        const webcam = NodeWebcam.create(webcamOptions);

        webcam.capture(path, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
};

// Fonction pour lire le QR code de l'image
const lireQRCode = async (path) => {
    try {
        const img = await Jimp.read(path);
        const { width, height } = img.bitmap;
        const imageData = img.bitmap.data;

        // Convertir l'image en un format compatible avec jsQR
        const qrCodeData = {
            data: new Uint8ClampedArray(imageData),
            width: width,
            height: height
        };

        const code = jsQR(qrCodeData.data, qrCodeData.width, qrCodeData.height, { inversionAttempts: "dontInvert" });

        if (code) {
            console.log('Données du QR code :', code.data);
        } else {
            console.log('Aucun QR code détecté.');
        }
    } catch (error) {
        console.error('Erreur lors de la lecture du QR code :', error);
    }
};

// Chemin où l'image sera temporairement enregistrée
const imagePath = 'C:\\Users\\staff\\Desktop\\RESTAPI\\capture.jpg';

// Fonction pour capturer et scanner le QR code toutes les 5 secondes
const captureAndScanQRCode = () => {
    setInterval(async () => {
        try {
            await captureImage(imagePath);
            await lireQRCode(imagePath);
        } catch (error) {
            console.error('Erreur lors de la capture ou de la lecture du QR code :', error);
        }
    }, 5000); // Interval de 5 secondes
};

// Démarrage de la capture et du scan du QR code
captureAndScanQRCode();
