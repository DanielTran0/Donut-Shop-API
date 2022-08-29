const express = require('express');
const userController = require('../controllers/userAdminController');
const authenticateRoute = require('../configs/passport/passportConfig');

const router = express.Router();

router.get('/', authenticateRoute, userController.getAllUsers);

router.post('/', userController.postCreatedUser);
router.post('/login', userController.postUserLogin);

router.put('/', authenticateRoute, userController.putChangeUser);

router.delete('/', authenticateRoute, userController.deleteUser);

module.exports = router;
