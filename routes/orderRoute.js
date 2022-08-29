const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

// TODO authenticate and add controllers for routes
router.get('/year', orderController.getAllOrdersForYear);
router.get('/search', orderController.getSearchOrder);
router.get('/:orderId', orderController.getOrder);

router.post('/', orderController.postCreatedOrder);

router.put('/status/:orderId', orderController.putChangeOrderStatus);
router.put('/info/:orderId', orderController.putChangeOrderInfo);
router.put('/cancel/:orderId', orderController.putCancelOrder);

module.exports = router;
