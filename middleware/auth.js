const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log("Authorization Header reçu :", authHeader); // Vérifier ce qui est reçu

    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log("Aucun token reçu !");
        return res.status(401).json({ erreur: "Token manquant" });
    }

    jwt.verify(token, 'xyzabc', (err, user) => {
        if (err) {
            console.log("Token invalide :", err);
            return res.status(403).json({ erreur: "Token invalide" });
        }

        console.log("Utilisateur authentifié :", user); // Voir si on récupère l'ID utilisateur
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
