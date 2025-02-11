const express=require('express');
const { logout } = require("../controller/deconnexion");


const router=express.Router();

router.post("/deconnexion",logout);

module.exports=router;