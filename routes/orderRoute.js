const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();
router.get('/:orderId', orderController.getOrder);
router.post('/', orderController.postCreatedOrder);
router.put('/:orderId');
router.delete('/:orderId');

module.exports = router;
