const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();
router.post('/', userController.postCreatedUser);
router.put('/:userId', userController.putChangeUser);
router.delete('/:userId', userController.deleteUser);

module.exports = router;
