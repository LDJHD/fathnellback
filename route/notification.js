// routes/notification.js

const express = require('express');
const {
    ajouterNotification,
    listallNotification,
    detailNotification,
    deleteNotification,
    updateNotification,
    contNonLuNotification,
    countNotification
} = require('../controller/notification');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/notification/create',authenticateToken, ajouterNotification);
router.get('/notification/listall',authenticateToken, listallNotification);
router.post('/notification/detailById',authenticateToken, detailNotification);
router.post('/notification/delete',authenticateToken, deleteNotification);
router.post('/notification/update',authenticateToken, updateNotification);
router.get('/notification/countnotification',authenticateToken, countNotification);
router.get('/notification/countnotificationnonlu',authenticateToken, contNonLuNotification);

module.exports = router;
