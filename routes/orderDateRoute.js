const express = require('express');
const orderDateController = require('../controllers/orderDateController');

const router = express.Router();
router.get('/', orderDateController.get3WeeksOfOpenOrderDates);
router.get('/all', orderDateController.getAllOrderDates);
router.post('/', orderDateController.postAllWeekendOrderDaysInYear);
router.put('/dayOff/:orderDateId', orderDateController.putTurnOrderDateOff);
router.put(
	'/remainingOrders/:orderDateId',
	orderDateController.putChangeOrderLimit
);
router.delete('/:orderDateId', orderDateController.deleteOrderDate);

module.exports = router;
