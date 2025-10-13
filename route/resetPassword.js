const express=require('express');
const {
    requestResetPassword,
    verifyResetPassword,
    setNewPassword
    } = require("../controller/resetPassword");


const router=express.Router();

router.post("/reset-password",requestResetPassword);
router.post("/reset-password/verify",verifyResetPassword);
router.post("/reset-password/new",setNewPassword);

module.exports=router;