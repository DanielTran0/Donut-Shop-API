const { body, validationResult } = require('express-validator');
const { isValidObjectId } = require('mongoose');
const sgMail = require('@sendgrid/mail');
const Order = require('../models/order');
const OrderDate = require('../models/orderDate');
const SaleItem = require('../models/saleItem');
const Flavour = require('../models/flavour');
const dateMethods = require('../util/dateMethods');
const orderValidationMethods = require('../util/orderValidationMethods');
const orderUtil = require('../util/orderUtil');
const emailFormat = require('../util/emailFormat');

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

module.exports.postCreatedOrder = [
	body('firstName').trim().notEmpty(),
	body('lastName').trim().notEmpty(),
	body('email').trim().isEmail().normalizeEmail(),
	body('phone').trim().isMobilePhone('en-CA'),
	body('allergy').trim().optional({ checkFalsy: true }),
	body('dateOrderPickUp')
		.trim()
		.custom((value) => /^\d{4}\/\d{2}\/\d{2}$/.test(value))
		.withMessage('yyyy/MM/dd'),
	body('timeOrderPickUpHour')
		.trim()
		.custom((value) => {
			if (!value) return false;

			const hour = parseInt(value, 10);

			if (Number.isNaN(hour) || hour < 12 || hour > 16) return false;

			return true;
		})
		.withMessage('time has to be between 12 to 16'),
	body('timeOrderPickUpMinute')
		.trim()
		.custom((value, { req }) => {
			if (!value) return false;

			const min = parseInt(value, 10);
			const hour = parseInt(req.body.timeOrderPickUpHour, 10);

			if (
				Number.isNaN(min) ||
				min < 0 ||
				min > 59 ||
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
			if (!dateMethods.isOrderDateIn3WeekRange(dateOrderPickUp)) {
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
			if (
				!dateMethods.isOrderBeforeFridayDeadline(currentDate, dateOrderPickUp)
			) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'order has to be placed by Friday 6:00 pm',
							param: 'dateOrderPickUp',
							value: dateOrderPickUp,
						},
					],
				});
			}
			if (
				!orderValidationMethods.doAllOrderItemNamesExist(
					orderItems,
					saleItems,
					flavours
				)
			) {
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

			orderValidationMethods.addSaleItemPriceAndQuantityToOrder(
				orderItems,
				saleItems
			);

			if (!orderValidationMethods.validFlavourQuantity(orderItems)) {
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
				orderValidationMethods.calculateAmountAndCostOfOrderItems(orderItems);
			const newRemainingOrders = orderDate.remainingOrders - totalAmount;

			if (newRemainingOrders < 0) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'order amount will exceed our daily order limit',
							param: 'orderItems',
							value: orderItems,
						},
					],
				});
			}

			const dateOrderPickUpFull = dateMethods.formatDateToStringFull(
				new Date(dateOrderPickUp)
			);
			const pickUpDateTime = new Date(dateOrderPickUp);
			pickUpDateTime.setHours(timeOrderPickUpHour);
			pickUpDateTime.setMinutes(timeOrderPickUpMinute);
			const timeOrderPickUp = dateMethods.formatTimeToString(pickUpDateTime);
			const dateOrderPlaced = dateMethods.formatDateToString(currentDate);
			const dateOrderPlacedFull =
				dateMethods.formatDateToStringFull(currentDate);
			const timeOrderPlaced = dateMethods.formatTimeToString(currentDate);

			const newOrder = new Order({
				firstName,
				lastName,
				email,
				phone,
				allergy,
				dateOrderPlaced,
				timeOrderPlaced,
				dateOrderPickUp,
				timeOrderPickUp,
				orderItems,
				totalCost,
			});

			await newOrder.save();

			orderDate.orders.push(newOrder._id);
			orderDate.remainingOrders = newRemainingOrders;
			await orderDate.save();

			const orderItemMsg = emailFormat.formatOrderItems(orderItems);
			const dynamicTemplateData = {
				firstName,
				lastName,
				email,
				phone,
				dateOrderPlacedFull,
				timeOrderPlaced,
				dateOrderPickUp,
				dateOrderPickUpFull,
				timeOrderPickUp,
				totalCost,
				_id: newOrder._id,
				allergy: allergy || 'None',
				orderItems: orderItemMsg,
			};

			const ownerMsg = {
				to: process.env.OWNER_EMAIL,
				from: process.env.OWNER_EMAIL,
				templateId: process.env.TEMPLATE_ORDER_PLACED_TO_OWNER,
				dynamicTemplateData,
			};
			const clientMsg = {
				to: email,
				from: process.env.OWNER_EMAIL,
				templateId: process.env.TEMPLATE_ORDER_PLACED_TO_CLIENT,
				dynamicTemplateData,
			};

			// await sgMail.send(ownerMsg);
			// await sgMail.send(clientMsg);

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeOrderStatus = [
	body('status')
		.trim()
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
	body('cancelMessage')
		.trim()
		.custom((msg, { req }) => {
			if (req.status === 'Cancelled' && !msg) return false;

			return true;
		})
		.withMessage('Cancelled order needs reason for cancellation to client'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { status, cancelMessage } = req.body;
		const { orderId } = req.params;
		// TODO if status is approved and paid set paid to true
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
			if (status === 'Cancelled') {
				await orderUtil.addCancelledAmountBackToOrderDate(
					order.orderItems,
					order.pickUpDateTime
				);

				// const {
				// 	_id,
				// 	firstName,
				// 	lastName,
				// 	email,
				// 	phone,
				// 	dateOrderPickUp,
				// 	timeOrderPickUp,
				// 	dateOrderPlaced,
				// 	timeOrderPlaced,
				// 	orderItems,
				// 	totalCost,
				// 	paid,
				// } = order;

				// const dateOrderPickUpFull = dateMethods.formatDateToStringFull(
				// 	new Date(dateOrderPickUp)
				// );
				// const dateOrderPlacedFull =
				// 	dateMethods.formatDateToStringFull(dateOrderPlaced);

				// const dynamicTemplateData = {
				// 	_id,
				// 	firstName,
				// 	lastName,
				// 	email,
				// 	phone,
				// 	dateOrderPlacedFull,
				// 	timeOrderPlaced,
				// 	dateOrderPickUp,
				// 	dateOrderPickUpFull,
				// 	timeOrderPickUp,
				// 	totalCost,
				// 	allergy: allergy || 'None',
				// 	orderItems: orderItemMsg,
				// };

				// TODO send email to client on why order was cancelled
			} else if (status === 'Approved, Waiting on Payment') {
				// TODO send email to client that order was approved, waiting on payment
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
		if (
			!dateMethods.isOrderBeforeFridayDeadline(
				currentDate,
				order.dateOrderPickUp
			)
		) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						location: 'body',
						msg: 'order has to be canceled by the Friday before by 6:00 pm',
						param: 'order',
						value: order.dateOrderPickUp,
					},
				],
			});
		}

		await orderUtil.addCancelledAmountBackToOrderDate(
			order.orderItems,
			order.dateOrderPickUp
		);

		const {
			_id,
			firstName,
			lastName,
			email,
			phone,
			dateOrderPickUp,
			timeOrderPickUp,
			status,
			orderItems,
			totalCost,
			paid,
		} = order;

		const cancelMsgToOwner = {
			to: process.env.OWNER_EMAIL,
			from: process.env.OWNER_EMAIL,
			templateId: process.env.TEMPLATE_ORDER_CANCELLED_TO_OWNER,
			dynamicTemplateData: {
				_id,
				firstName,
				lastName,
				email,
				phone,
				dateOrderPickUp,
				timeOrderPickUp,
				status,
				totalCost,
				paid,
				dateOrderPickUpFull: dateMethods.formatDateToStringFull(
					new Date(dateOrderPickUp)
				),
				dateCancelled: dateMethods.formatDateToStringFull(
					new Date(currentDate)
				),
				timeCancelled: dateMethods.formatTimeToString(currentDate),
				orderItems: emailFormat.formatOrderItems(orderItems),
			},
		};

		await sgMail.send(cancelMsgToOwner);

		order.status = 'Cancelled';
		// await order.save();

		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
};

module.exports.putChangeOrderInfo = [
	body('firstName').trim().optional({ checkFalsy: true }),
	body('lastName').trim().optional({ checkFalsy: true }),
	body('email')
		.trim()
		.isEmail()
		.normalizeEmail()
		.optional({ checkFalsy: true }),
	body('phone').trim().isMobilePhone('en-CA').optional({ checkFalsy: true }),
	body('note').trim().optional({ checkFalsy: true }),
	body('allergy').trim().optional({ checkFalsy: true }),
	body('dateOrderPickUp')
		.trim()
		.custom((value) => {
			if (!value) return true;

			return /^\d{4}\/\d{2}\/\d{2}$/.test(value);
		})
		.withMessage('yyyy/MM/dd'),
	body('timeOrderPickUpHour')
		.trim()
		.custom((value) => {
			if (!value) return true;

			const hour = parseInt(value, 10);

			if (Number.isNaN(hour) || hour < 0 || hour > 23) return false;

			return true;
		})
		.withMessage('pick hour between 0 - 23'),
	body('timeOrderPickUpMinute')
		.trim()
		.custom((value) => {
			if (!value) return true;

			const min = parseInt(value, 10);

			if (Number.isNaN(min) || min < 0 || min > 59) return false;

			return true;
		})
		.withMessage('pick minute between 0 - 59'),
	body('paid')
		.trim()
		.custom((value) => {
			if (!value) return true;

			return ['true', 'false'].includes(value);
		})
		.withMessage('true or false'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const currentDate = new Date();
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
			paid,
		} = req.body;
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
			const orderDate = await OrderDate.findOne({ date: dateOrderPickUp });

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

			if (dateOrderPickUp) {
				if (dateOrderPickUp === order.dateOrderPickUp) {
					return res.status(400).json({
						info: req.body,
						errors: [
							{
								location: 'body',
								msg: 'this date is currently the order date',
								param: 'dateOrderPickUp',
								value: dateOrderPickUp,
							},
						],
					});
				}
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
				if (!dateMethods.isOrderDateIn3WeekRange(dateOrderPickUp)) {
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
				if (
					!dateMethods.isOrderBeforeFridayDeadline(currentDate, dateOrderPickUp)
				) {
					return res.status(400).json({
						info: req.body,
						errors: [
							{
								location: 'body',
								msg: 'order has to be placed by Friday 6:00 pm',
								param: 'dateOrderPickUp',
								value: dateOrderPickUp,
							},
						],
					});
				}

				const { totalAmount } =
					orderValidationMethods.calculateAmountAndCostOfOrderItems(
						order.orderItems
					);
				const newRemainingOrders = orderDate.remainingOrders - totalAmount;

				if (newRemainingOrders < 0) {
					return res.status(400).json({
						info: req.body,
						errors: [
							{
								location: 'body',
								msg: 'order amount will exceed our daily order limit',
								param: 'orderItems',
								value: order.orderItems,
							},
						],
					});
				}

				const previousOrderDate = await OrderDate.findOne({
					date: order.dateOrderPickUp,
				});

				await orderUtil.addCancelledAmountBackToOrderDate(
					order.orderItems,
					previousOrderDate.date
				);

				previousOrderDate.orders = previousOrderDate.orders.filter(
					(id) => toString(id) !== toString(order._id)
				);

				await previousOrderDate.save();

				orderDate.orders.push(order._id);
				orderDate.remainingOrders = newRemainingOrders;
				await orderDate.save();
			}

			const pickUpDateTime = new Date(currentDate);
			pickUpDateTime.setHours(timeOrderPickUpHour);
			pickUpDateTime.setMinutes(timeOrderPickUpMinute);
			const timeOrderPickUp = dateMethods.formatTimeToString(pickUpDateTime);

			await Order.findByIdAndUpdate(orderId, {
				firstName: firstName || order.firstName,
				lastName: lastName || order.lastName,
				email: email || order.email,
				phone: phone || order.phone,
				note: note || order.note,
				allergy: allergy || order.allergy,
				dateOrderPickUp: dateOrderPickUp || order.dateOrderPickUp,
				timeOrderPickUp: timeOrderPickUp || order.timeOrderPickUp,
				paid: paid || order.paid,
			});

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];
