const { body, validationResult } = require('express-validator');
const OrderDate = require('../models/orderDate');
const {
	generateAllWeekendsInAYear,
	generateOrderDates,
	generate3WeekDateRange,
} = require('../util/dateMethods');

module.exports.get3WeeksOfOpenOrderDates = async (req, res, next) => {
	try {
		const { startDate, endDate } = generate3WeekDateRange();
		const orderDates = await OrderDate.find({
			dateFormatted: { $gte: startDate, $lte: endDate },
			dayOff: false,
		});
		res.json({ orderDates });
	} catch (error) {
		next(error);
	}
};

module.exports.getAllOrderDates = async (req, res, next) => {
	try {
		const orderDates = await OrderDate.find();
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

module.exports.putTurnOrderDateOff = [
	body('dayOff')
		.trim()
		.escape()
		.custom((value) => ['true', 'false'].includes(value))
		.withMessage('true or false'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { dayOff } = req.body;
		const { orderDateId } = req.params;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}

		try {
			const orderDateExists = await OrderDate.findById(orderDateId);

			if (!orderDateExists) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'order date does not exist',
							param: 'orderDateId',
							value: orderDateId,
						},
					],
				});
			}

			await OrderDate.findByIdAndUpdate(orderDateId, { dayOff });

			return res.json({ msg: 'successful' });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeOrderLimit = [
	body('remainingOrders').trim().escape().isNumeric(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { remainingOrders } = req.body;
		const { orderDateId } = req.params;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}

		try {
			const orderDateExists = await OrderDate.findById(orderDateId);

			if (!orderDateExists) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'order date does not exist',
							param: 'orderDateId',
							value: orderDateId,
						},
					],
				});
			}

			await OrderDate.findByIdAndUpdate(orderDateId, { remainingOrders });

			return res.json({ msg: 'successful' });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deleteOrderDate = async (req, res, next) => {
	const { orderDateId } = req.params;

	try {
		const orderDateExists = await OrderDate.findById(orderDateId);

		if (!orderDateExists) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						msg: 'order date does not exist',
						param: 'orderDateId',
						value: orderDateId,
					},
				],
			});
		}

		await OrderDate.findByIdAndDelete(orderDateId);

		return res.json({ msg: 'successful' });
	} catch (error) {
		return next(error);
	}
};
