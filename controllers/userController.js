const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { isValidObjectId } = require('mongoose');
const User = require('../models/user');

module.exports.postCreatedUser = [
	body('email').trim().escape().isEmail().normalizeEmail(),
	body('firstName').trim().escape().isAlphanumeric(),
	body('lastName').trim().escape().isAlphanumeric(),
	body('password')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5.')
		.matches('[0-9]')
		.withMessage('Must contain a number.')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter.'),
	body('passwordConfirmation')
		.custom((value, { req }) => value === req.body.password)
		.withMessage('Must be identical to password'),
	body('adminPassword')
		.trim()
		.escape()
		.custom((val) => val === process.env.ADMIN_PASSWORD)
		.withMessage('Incorrect admin password'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { email, password, firstName, lastName } = req.body;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ user: req.body, errors: formErrors.array() });
		}

		try {
			const isEmailUsed = await User.exists({ email });

			if (isEmailUsed) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'Email is already used',
							param: 'email',
							value: email,
						},
					],
				});
			}

			const hashedPassword = await bcrypt.hash(password, 10);
			const user = new User({
				email,
				firstName,
				lastName,
				password: hashedPassword,
				isAdmin: true,
			});

			await user.save();

			return res.json({ msg: 'successful' });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeUser = [
	body('firstName').trim().escape().isAlphanumeric(),
	body('lastName').trim().escape().isAlphanumeric(),
	body('password')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5.')
		.matches('[0-9]')
		.withMessage('Must contain a number.')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter.'),
	body('passwordConfirmation')
		.custom((value, { req }) => value === req.body.password)
		.withMessage('Must be identical to password'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { password, firstName, lastName } = req.body;
		const { userId } = req.params;

		if (!formErrors.isEmpty()) {
			res.status(400);
			return res.json({ user: req.body, errors: formErrors.array() });
		}
		if (!isValidObjectId(userId)) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						msg: 'invalid user id',
						param: 'userId',
						value: userId,
					},
				],
			});
		}

		try {
			const user = await User.findById(userId);

			if (!user) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'User does not exist',
							param: 'userId',
							value: userId,
						},
					],
				});
			}

			await User.findOneAndUpdate(userId, {
				password,
				firstName,
				lastName,
			});

			return res.json({ msg: 'successful' });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deleteUser = async (req, res, next) => {
	try {
		const { userId } = req.params;

		if (!isValidObjectId(userId)) {
			return res.status(400).json({
				errors: [
					{
						msg: 'invalid user id',
						param: 'userId',
						value: userId,
					},
				],
			});
		}

		const userExist = await User.findById(userId);

		if (!userExist) {
			return res.status(400).json({
				errors: [
					{
						msg: 'user does not exist',
						param: 'userId',
						value: userId,
					},
				],
			});
		}

		await User.findByIdAndDelete(userId);

		return res.json({ msg: 'successful' });
	} catch (error) {
		return next(error);
	}
};
