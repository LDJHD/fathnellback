const express=require('express');
const { ajouterPropos,
    listallPropos,
    detailPropos,
    deletePropos,
    updatePropos,
    listUserPropos,
    ajouterProposSiPossible
 } = require("../controller/propos");


const router=express.Router();
const authenticateToken = require('../middleware/auth');

router.post("/propos/create",authenticateToken,ajouterPropos);
router.get('/propos/listall',authenticateToken,listallPropos);
router.post('/propos/detailById',authenticateToken,detailPropos);
router.post('/propos/delete',authenticateToken,deletePropos);
router.post('/propos/update',authenticateToken,updatePropos);
router.post('/propos/listUserpropos',authenticateToken,listUserPropos);
router.post('/propos/ajout',authenticateToken,ajouterProposSiPossible);

module.exports=router;