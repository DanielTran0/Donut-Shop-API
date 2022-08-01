const { body, validationResult } = require('express-validator');
const OrderDate = require('../models/orderDate');
const {
	generateAllWeekendsInAYear,
	generateOrderDates,
} = require('../util/dateMethods');

// module.exports.getAllDaysOff = async (req, res, next) => {};

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

// module.exports.postCreatedDaysOff = [
// 	body('day').trim().isDate().withMessage('YYYY/MM/DD'),
// 	async (req, res, next) => {
// 		const formErrors = validationResult(req);
// 		const { day } = req.body;

// 		if (!formErrors.isEmpty()) {
// 			return res
// 				.status(400)
// 				.json({ info: req.body, errors: formErrors.array() });
// 		}
// 		if (isBefore(date, Date.now())) {
// 			return res.status(400).json({
// 				info: req.body,
// 				errors: [
// 					{
// 						location: 'body',
// 						msg: 'pick a future day',
// 						param: 'day',
// 						value: day,
// 					},
// 				],
// 			});
// 		}
// 		if (!isWeekend(date)) {
// 			return res.status(400).json({
// 				info: req.body,
// 				errors: [
// 					{
// 						location: 'body',
// 						msg: 'pick a weekend day',
// 						param: 'day',
// 						value: day,
// 					},
// 				],
// 			});
// 		}

// 		next();
// 		try {
// 			// const dayOff = new DaysOff({ day });
// 			// dayOff.save();
// 			// return res.json({ msg: 'successful' });
// 		} catch (error) {
// 			return next(error);
// 		}
// 	},
// ];

// module.exports.putChangeDaysOff = [];

// module.exports.deleteDaysOff = async (req, res, next) => {};
