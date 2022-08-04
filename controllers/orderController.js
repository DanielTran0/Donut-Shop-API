const { body, validationResult } = require('express-validator');
const Order = require('../models/order');
const OrderDate = require('../models/orderDate');
const {
	formatDateToString,
	formatTimeToString,
	isOrderDateIn3WeekRange,
	isOrderIsBeforeFridayDeadline,
} = require('../util/dateMethods');

module.exports.postCreatedOrder = [
	body('firstName').trim().escape().isAlphanumeric(),
	body('lastName').trim().escape().isAlphanumeric(),
	body('email').trim().escape().isEmail(),
	body('phone').trim().escape().isMobilePhone('en-CA'),
	body('note').trim().escape().optional({ checkFalsy: true }).isAlphanumeric(),
	body('allergy')
		.trim()
		.escape()
		.optional({ checkFalsy: true })
		.isAlphanumeric(),
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
				Number.isNaN(hour) ||
				min < 0 ||
				min > 60 ||
				(hour === 16 && min !== 0)
			)
				return false;

			return true;
		})
		.withMessage('time has to be between 12 to 16'),
	body('orderItems').trim().notEmpty(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
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
			orderItems,
		} = req.body;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}

		try {
			const orderDate = await OrderDate.findOne({ date: dateOrderPickUp });

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
			if (!isOrderDateIn3WeekRange(new Date(dateOrderPickUp))) {
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
				!isOrderIsBeforeFridayDeadline(new Date(), new Date(dateOrderPickUp))
			) {
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

			const dateForTimeFormat = new Date();
			dateForTimeFormat.setHours(timeOrderPickUpHour);
			dateForTimeFormat.setMinutes(timeOrderPickUpMinute);

			const newOrder = new Order({
				firstName,
				lastName,
				email,
				phone,
				note,
				allergy,
				dateOrderPickUp,
				dateOrderPlaced: formatDateToString(new Date()),
				timeOrderPlaced: formatTimeToString(new Date()),
				timeOrderPickUp: formatTimeToString(dateForTimeFormat),
				status: 'waiting for approval',
				paid: false,
				orderItems: JSON.parse(orderItems),
			});

			await newOrder.save();

			return res.json({ msg: 'successful' });
		} catch (error) {
			return next(error);
		}
	},
];
