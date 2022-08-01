const express = require('express');
const orderDateController = require('../controllers/orderDateController');

const router = express.Router();
router.get('/');
router.post(
	'/generateDatesForYear',
	orderDateController.postAllWeekendOrderDaysInYear
);
router.put('/:dayOffId');
router.delete('/:dayOffId');

module.exports = router;
