const logout = (req, res) => {
    try {
        // Le client devrait supprimer le token de son côté
        return res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        console.error("Erreur lors de la déconnexion :", error);
        return res.status(500).json({ erreur: "Erreur lors de la déconnexion" });
    }
};

module.exports = { logout };
