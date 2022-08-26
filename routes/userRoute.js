const express = require('express');
const userController = require('../controllers/userAdminController');
const authenticateRoute = require('../configs/passport/passportConfig');

const router = express.Router();

router.get('/', authenticateRoute, userController.getAllUsers);

router.post('/', authenticateRoute, userController.postCreatedUser);
router.post('/login', userController.postUserLogin);

router.put('/:userId', authenticateRoute, userController.putChangeUser);
router.delete('/:userId', authenticateRoute, userController.deleteUser);

module.exports = router;
