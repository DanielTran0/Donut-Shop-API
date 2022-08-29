const express = require('express');
const orderDateController = require('../controllers/orderDateController');
const authenticateRoute = require('../configs/passport/passportConfig');

const router = express.Router();

router.get('/', orderDateController.get3WeeksOfOpenOrderDates);
router.get(
	'/populate',
	authenticateRoute,
	orderDateController.get3WeeksOfOpenOrderDatesPopulatedOrders
);
router.get(
	'/year/:year',
	authenticateRoute,
	orderDateController.getAllOrderDatesForYear
);

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

/*
orderDate delete method not in use, no point in deleting date
can instead deactivate it with day off

router.delete(
	'/:orderDateId',
	authenticateRoute,
	orderDateController.deleteOrderDate
);
*/

module.exports = router;
