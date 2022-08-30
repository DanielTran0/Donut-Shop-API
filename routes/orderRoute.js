const express = require('express');
const orderController = require('../controllers/orderController');
const authenticateRoute = require('../configs/passport/passportConfig');

const router = express.Router();

router.get('/year', authenticateRoute, orderController.getAllOrdersForYear);
router.get('/search', authenticateRoute, orderController.getSearchOrder);
router.get('/:orderId', orderController.getOrder);

router.post('/', orderController.postCreatedOrder);

router.put(
	'/status/:orderId',
	authenticateRoute,
	orderController.putChangeOrderStatus
);
router.put(
	'/info/:orderId',
	authenticateRoute,
	orderController.putChangeOrderInfo
);
router.put('/cancel/:orderId', orderController.putCancelOrder);

module.exports = router;
