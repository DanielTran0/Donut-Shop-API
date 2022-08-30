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
		).sort({ date: 'asc' });
		const removeRemainingOrdersIfOver3 = orderDates.map((orderDate) => {
			const { _id, date, remainingOrders, dayOff } = orderDate;

			return {
				_id,
				date,
				dayOff,
				remainingOrders: remainingOrders <= 3 ? remainingOrders : null,
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
		const isSunday = new Date().getDay() === 0;
		const { startDate, endDate } = generate3WeekDateRange(isSunday);
		const orderDates = await OrderDate.find({
			date: { $gte: startDate, $lte: endDate },
		})
			.populate('orders')
			.sort({ date: 'asc' });

		res.json({ orderDates, success: true });
	} catch (error) {
		next(error);
	}
};

module.exports.getAllOrderDatesForYear = async (req, res, next) => {
	try {
		const { year } = req.params;

		if (!/^\d{4}$/.test(year)) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						location: 'body',
						msg: 'Enter 4 digit year',
						param: 'year',
						value: year,
					},
				],
			});
		}

		const orderDates = await OrderDate.find({ date: { $regex: year } }).sort({
			date: 'asc',
		});

		return res.json({ orderDates, success: true });
	} catch (error) {
		return next(error);
	}
};

module.exports.postAllWeekendOrderDaysInYear = [
	body('year')
		.trim()
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
			const orderDate = await OrderDate.findById(orderDateId).populate(
				'orders'
			);

			if (!orderDate) {
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

			if (JSON.parse(dayOff) && orderDate.orders.length > 0) {
				const { orders } = orderDate;

				for (let i = 0; i < orders.length; i += 1) {
					if (
						[
							'Waiting for Approval',
							'Approved, Waiting on Payment',
							'Approved and Paid',
						].includes(orders[i].status)
					) {
						return res.status(400).json({
							info: req.body,
							errors: [
								{
									msg: 'please cancel or complete all open orders before taking day off',
									param: 'orderDateId',
									value: orderDateId,
								},
							],
						});
					}
				}
			}

			await OrderDate.findByIdAndUpdate(orderDateId, { dayOff });

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeAddToOrderLimit = [
	body('additionalOrders').trim().isNumeric(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { additionalOrders } = req.body;
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
			const orderDate = await OrderDate.findById(orderDateId);

			if (!orderDate) {
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

			orderDate.remainingOrders += Number(additionalOrders);

			if (orderDate.remainingOrders < 0) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'remaining order can not be under 0',
							param: 'remainingOrders',
							value: additionalOrders,
						},
					],
				});
			}

			await orderDate.save();

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

/* 
Not in use, see comment in orderDate router

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
*/
