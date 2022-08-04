const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();
router.get('/');
router.post('/', orderController.postCreatedOrder);
router.put('/:orderId');
router.delete('/:orderId');

module.exports = router;
