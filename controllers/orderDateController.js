const { body, validationResult } = require('express-validator');
const OrderDate = require('../models/orderDate');
const {
	generateAllWeekendsInAYear,
	generateOrderDates,
	generate3WeekDateRange,
} = require('../util/dateMethods');

module.exports.getAllOrderDates = async (req, res, next) => {
	try {
		const orderDates = await OrderDate.find();
		res.json({ orderDates });
	} catch (error) {
		next(error);
	}
};

module.exports.get3WeeksOfOrderDates = async (req, res, next) => {
	try {
		const { startDate, endDate } = generate3WeekDateRange();
		const orderDates = await OrderDate.find({
			dateFormatted: { $gte: startDate, $lte: endDate },
		});
		res.json({ orderDates });
	} catch (error) {
		next(error);
	}
};

module.exports.postAllWeekendOrderDaysInYear = [
	body('year')
		.trim()
		.escape()
		.custom((year) => /^\d{4}$/.test(year))
		.withMessage('4 digit year'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { year } = req.body;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}

		try {
			const dateForYearExist = await OrderDate.exists({
				dateFormatted: { $regex: year },
			});

			if (dateForYearExist) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'this year already has dates generated',
							param: 'year',
							value: year,
						},
					],
				});
			}

			const weekends = generateAllWeekendsInAYear(year);
			const orderDates = generateOrderDates(weekends);

			for (let i = 0; i < orderDates.length; i += 1) {
				const newOrderDate = new OrderDate({ ...orderDates[i] });
				newOrderDate.save();
			}

			return res.json({ msg: 'successful' });
		} catch (error) {
			return next(error);
		}
	},
];

// module.exports.putChangeDaysOff = [];

// module.exports.deleteDaysOff = async (req, res, next) => {};
