const express=require('express');
const {
    ajouterUtilisateur,
    listallUtilisateur,
    detailUtilisateur,
    deleteUtilisateur,
    detailUserconnectUtilisateur,
    updateUtilisateur, } = require("../controller/utilisateur");

const authenticateToken = require('../middleware/auth');
const router=express.Router();

router.post("/utilisateurs/create",ajouterUtilisateur);
router.get('/utilisateur/listall',authenticateToken, listallUtilisateur);
router.post('/utilisateur/detailById',authenticateToken, detailUtilisateur);
router.post('/utilisateur/delete',authenticateToken, deleteUtilisateur);
router.post('/utilisateur/update',authenticateToken, updateUtilisateur);
router.get('/utilisateur/user',authenticateToken, detailUserconnectUtilisateur);

module.exports=router;