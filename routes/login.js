const userController = require('../controllers/user');
const express = require('express');
var router = express.Router();

// Route to handle the login
router.route('/').post(userController.loginUser);
module.exports = router;