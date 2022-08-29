const { body, validationResult } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const Order = require('../models/order');
const OrderDate = require('../models/orderDate');
const SaleItem = require('../models/saleItem');
const Flavour = require('../models/flavour');
const {
	formatDateToString,
	formatTimeToString,
	isOrderDateIn3WeekRange,
	isOrderBeforeFridayDeadline,
} = require('../util/dateMethods');
const {
	doAllOrderItemNamesExist,
	addSaleItemPriceAndQuantityToOrder,
	validFlavourQuantity,
	calculateAmountAndCostOfOrderItems,
} = require('../util/orderValidationMethods');
const { addCancelledAmountBackToOrderDate } = require('../util/orderUtil');

module.exports.getOrder = async (req, res, next) => {
	const { orderId } = req.params;

	if (!isValidObjectId(orderId)) {
		return res.status(400).json({
			errors: [
				{
					msg: 'invalid order id',
					param: 'orderId',
					value: orderId,
				},
			],
		});
	}

	try {
		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(400).json({
				errors: [
					{
						msg: 'order does not exist',
						param: 'orderId',
						value: orderId,
					},
				],
			});
		}

		return res.json({ order, success: true });
	} catch (error) {
		return next(error);
	}
};

module.exports.getAllOrdersForYear = async (req, res, next) => {
	try {
		const { year } = req.query;
		const skip = Number(req.query.skip);

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
		if (Number.isNaN(skip)) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						location: 'body',
						msg: 'Skip value is not a number',
						param: 'skip',
						value: skip,
					},
				],
			});
		}

		const orders = await Order.find({ dateOrderPickUp: { $regex: year } })
			.sort({ dateOrderPickUp: 'asc' })
			.limit(15)
			.skip(skip);

		return res.json({ orders, success: true });
	} catch (error) {
		return next(error);
	}
};

module.exports.getSearchOrder = async (req, res, next) => {
	try {
		const queryOptions = {
			firstName: true,
			lastName: true,
			email: true,
			dateOrderPickUp: true,
		};
		const queryKeys = Object.keys(req.query);
		const validQueryKeys = queryKeys.filter(
			(key) => queryOptions[key] && req.query[key]
		);

		if (validQueryKeys.length === 0) {
			return res.status(400).json({
				info: req.query,
				errors: [
					{
						location: 'body',
						msg: 'Please enter valid query',
						param: 'query',
					},
				],
			});
		}

		const query = {};
		for (let i = 0; i < validQueryKeys.length; i += 1) {
			const queryKey = validQueryKeys[i];

			query[queryKey] = { $regex: new RegExp(req.query[queryKey], 'i') };
		}

		const orders = await Order.find({ ...query }).sort({
			dateOrderPickUp: 'asc',
		});

		return res.json({ orders, success: true });
	} catch (error) {
		return next(error);
	}
};

// TODO add email to owner and client
module.exports.postCreatedOrder = [
	body('firstName').trim().escape().isAlphanumeric('en-US', { ignore: ' ' }),
	body('lastName').trim().escape().isAlphanumeric('en-US', { ignore: ' ' }),
	body('email').trim().escape().isEmail().normalizeEmail(),
	body('phone').trim().escape().isMobilePhone('en-CA'),
	body('note')
		.trim()
		.escape()
		.optional({ checkFalsy: true })
		.isAlphanumeric('en-US', { ignore: ' ' }),
	body('allergy')
		.trim()
		.escape()
		.optional({ checkFalsy: true })
		.isAlphanumeric('en-US', { ignore: ' ' }),
	body('dateOrderPickUp')
		.trim()
		.custom((value) => /^\d{4}\/\d{2}\/\d{2}$/.test(value))
		.withMessage('yyyy/MM/dd'),
	body('timeOrderPickUpHour')
		.trim()
		.escape()
		.custom((value) => {
			if (!value) return false;

			const hour = parseInt(value, 10);

			if (Number.isNaN(hour) || hour < 12 || hour > 16) return false;

			return true;
		})
		.withMessage('time has to be between 12 to 16'),
	body('timeOrderPickUpMinute')
		.trim()
		.escape()
		.custom((value, { req }) => {
			if (!value) return false;

			const min = parseInt(value, 10);
			const hour = parseInt(req.body.timeOrderPickUpHour, 10);

			if (
				Number.isNaN(min) ||
				min < 0 ||
				min > 60 ||
				(hour === 16 && min !== 0)
			)
				return false;

			return true;
		})
		.withMessage('time has to be between 12 to 16'),
	body('orderItems')
		.trim()
		.custom((value) => {
			if (!value) return false;

			const order = JSON.parse(value);

			if (!Array.isArray(order)) return false;

			for (let i = 0; i < order.length; i += 1) {
				const { saleItem, flavours } = order[i];

				if (!saleItem || !flavours) return false;
				if (!saleItem.name || !saleItem.amount) return false;

				for (let j = 0; j < flavours.length; j += 1) {
					const flavour = flavours[j];
					if (!flavour.name || !flavour.quantity) return false;
				}
			}

			return true;
		})
		.withMessage(
			'order items must have sale item object & flavours array both with name and quantity'
		),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const currentDate = new Date();
		const orderItems = JSON.parse(req.body.orderItems);
		const {
			firstName,
			lastName,
			email,
			phone,
			note,
			allergy,
			dateOrderPickUp,
			timeOrderPickUpHour,
			timeOrderPickUpMinute,
		} = req.body;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}

		try {
			const orderDate = await OrderDate.findOne({ date: dateOrderPickUp });
			const saleItems = await SaleItem.find({}, 'name quantity price');
			const flavours = await Flavour.find({}, 'name');

			if (!orderDate || orderDate?.dayOff) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: !orderDate
								? 'orders for weekend only'
								: 'day is closed for orders',
							param: 'dateOrderPickUp',
							value: dateOrderPickUp,
						},
					],
				});
			}
			if (!isOrderDateIn3WeekRange(dateOrderPickUp)) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'order date has to be within 3 week range',
							param: 'dateOrderPickUp',
							value: dateOrderPickUp,
						},
					],
				});
			}
			if (!isOrderBeforeFridayDeadline(currentDate, dateOrderPickUp)) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'order has to be placed by Friday 4:00 pm',
							param: 'dateOrderPickUp',
							value: dateOrderPickUp,
						},
					],
				});
			}
			if (!doAllOrderItemNamesExist(orderItems, saleItems, flavours)) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'flavour(s) or sale item(s) do not exist',
							param: 'orderItems',
							value: orderItems,
						},
					],
				});
			}

			addSaleItemPriceAndQuantityToOrder(orderItems, saleItems);

			if (!validFlavourQuantity(orderItems)) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'quantity of flavours do not match total quantity of sale items',
							param: 'orderItems',
							value: orderItems,
						},
					],
				});
			}

			const { totalAmount, totalCost } =
				calculateAmountAndCostOfOrderItems(orderItems);
			const newRemainingOrders = orderDate.remainingOrders - totalAmount;

			if (newRemainingOrders < 0) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'order amount exceeds daily order limit',
							param: 'orderItems',
							value: orderItems,
						},
					],
				});
			}

			const pickUpDateTime = new Date(dateOrderPickUp);
			pickUpDateTime.setHours(timeOrderPickUpHour);
			pickUpDateTime.setMinutes(timeOrderPickUpMinute);

			const newOrder = new Order({
				firstName,
				lastName,
				email,
				phone,
				note,
				allergy,
				dateOrderPickUp,
				orderItems,
				totalCost,
				timeOrderPickUp: formatTimeToString(pickUpDateTime),
				dateOrderPlaced: formatDateToString(currentDate),
				timeOrderPlaced: formatTimeToString(currentDate),
			});

			await newOrder.save();

			orderDate.orders.push(newOrder._id);
			orderDate.remainingOrders = newRemainingOrders;
			await orderDate.save();

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeOrderStatus = [
	body('status')
		.trim()
		.escape()
		.custom((status) =>
			[
				'Waiting for Approval',
				'Approved, Waiting on Payment',
				'Approved and Paid',
				'Cancelled',
				'Completed',
			].includes(status)
		)
		.withMessage('Invalid order status'),
	body('message')
		.trim()
		.escape()
		.custom((message, { req }) => {
			if (req.status === 'Cancelled' && !message) return false;

			return true;
		})
		.withMessage('Cancelled order needs reason for cancellation to client'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { status, message } = req.body;
		const { orderId } = req.params;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}
		if (!isValidObjectId(orderId)) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						msg: 'invalid order id',
						param: 'orderId',
						value: orderId,
					},
				],
			});
		}

		try {
			const order = await Order.findById(orderId);

			if (!order) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'order does not exist',
							param: 'orderId',
							value: orderId,
						},
					],
				});
			}
			if (order.status === status) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'order currently has this status',
							param: 'status',
							value: status,
						},
					],
				});
			}
			if (order.status === 'Cancelled') {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'cannot change status of cancelled order',
							param: 'status',
							value: status,
						},
					],
				});
			}
			if (status === 'Cancelled') {
				await addCancelledAmountBackToOrderDate(
					order.orderItems,
					order.pickUpDateTime
				);

				// TODO send email to client on why order was cancelled
			}

			order.status = status;
			await order.save();

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putCancelOrder = async (req, res, next) => {
	const currentDate = new Date();
	const { orderId } = req.params;

	if (!isValidObjectId(orderId)) {
		return res.status(400).json({
			info: req.body,
			errors: [
				{
					msg: 'invalid order id',
					param: 'orderId',
					value: orderId,
				},
			],
		});
	}

	try {
		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						msg: 'order does not exist',
						param: 'orderId',
						value: orderId,
					},
				],
			});
		}
		if (order.status === 'Cancelled') {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						msg: 'Order has already been cancelled',
						param: 'status',
						value: 'Cancelled',
					},
				],
			});
		}
		// TODO check if date is before friday deadline

		await addCancelledAmountBackToOrderDate(order.orderItems, currentDate);

		// TODO send email to client on why order was cancelled

		order.status = 'Cancelled';
		await order.save();

		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
};

module.exports.putAcceptOrder = () => {};

module.exports.putChangeOrderInfo = () => {};
