const express = require('express');
const orderDateController = require('../controllers/orderDateController');
const authenticateRoute = require('../configs/passport/passportConfig');

const router = express.Router();

router.get('/', orderDateController.get3WeeksOfOpenOrderDates);
router.get(
	'/admin',
	authenticateRoute,
	orderDateController.get3WeeksOfOpenOrderDatesPopulatedOrders
);
router.get('/all', authenticateRoute, orderDateController.getAllOrderDates);

router.post(
	'/',
	authenticateRoute,
	orderDateController.postAllWeekendOrderDaysInYear
);

router.put(
	'/dayOff/:orderDateId',
	authenticateRoute,
	orderDateController.putTurnOrderDateOff
);
router.put(
	'/remainingOrders/:orderDateId',
	authenticateRoute,
	orderDateController.putChangeOrderLimit
);

router.delete(
	'/:orderDateId',
	authenticateRoute,
	orderDateController.deleteOrderDate
);

module.exports = router;
