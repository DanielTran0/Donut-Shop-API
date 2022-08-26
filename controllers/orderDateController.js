const { body, validationResult } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const OrderDate = require('../models/orderDate');
const {
	generateAllWeekendsInAYear,
	generateOrderDates,
	generate3WeekDateRange,
} = require('../util/dateMethods');

module.exports.get3WeeksOfOpenOrderDates = async (req, res, next) => {
	try {
		const { startDate, endDate } = generate3WeekDateRange();
		const orderDates = await OrderDate.find(
			{
				date: { $gte: startDate, $lte: endDate },
				dayOff: false,
			},
			{ orders: false }
		);
		const removeRemainingOrdersIfOver3 = orderDates.map((orderDate) => {
			const { _id, date, remainingOrders, dayOff } = orderDate;

			return {
				_id,
				date,
				dayOff,
				remainingOrders: remainingOrders < 3 ? remainingOrders : null,
			};
		});

		res.json({ orderDates: removeRemainingOrdersIfOver3, success: true });
	} catch (error) {
		next(error);
	}
};

module.exports.get3WeeksOfOpenOrderDatesPopulatedOrders = async (
	req,
	res,
	next
) => {
	try {
		const { startDate, endDate } = generate3WeekDateRange();
		const orderDates = await OrderDate.find({
			date: { $gte: startDate, $lte: endDate },
		}).populate('orders');
		res.json({ orderDates, success: true });
	} catch (error) {
		next(error);
	}
};

module.exports.getAllOrderDates = async (req, res, next) => {
	try {
		const orderDates = await OrderDate.find();
		res.json({ orderDates, success: true });
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
				date: { $regex: year },
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

			return res.json({ success: true });
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
		if (!isValidObjectId(orderDateId)) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						msg: 'invalid order date id',
						param: 'orderDateId',
						value: orderDateId,
					},
				],
			});
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

			return res.json({ success: true });
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
		if (!isValidObjectId(orderDateId)) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						msg: 'invalid order date id',
						param: 'orderDateId',
						value: orderDateId,
					},
				],
			});
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

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deleteOrderDate = async (req, res, next) => {
	const { orderDateId } = req.params;

	if (!isValidObjectId(orderDateId)) {
		return res.status(400).json({
			errors: [
				{
					msg: 'invalid order date id',
					param: 'orderDateId',
					value: orderDateId,
				},
			],
		});
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

		await OrderDate.findByIdAndDelete(orderDateId);

		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
};
