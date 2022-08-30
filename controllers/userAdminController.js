const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { isValidObjectId } = require('mongoose');
const User = require('../models/user');
const jwtUtil = require('../util/jwtUtil');

module.exports.getAllUsers = async (req, res, next) => {
	try {
		const users = await User.find().sort({ email: 'asc' });

		res.json({ users, success: true });
	} catch (error) {
		next(error);
	}
};

module.exports.postCreatedUser = [
	body('email').trim().isEmail().normalizeEmail(),
	body('firstName').trim().notEmpty(),
	body('lastName').trim().notEmpty(),
	body('password')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5')
		.matches('[0-9]')
		.withMessage('Must contain a number')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter'),
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
			return res
				.status(400)
				.json({ user: req.body, errors: formErrors.array() });
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
			const newUser = new User({
				email,
				firstName,
				lastName,
				password: hashedPassword,
				isAdmin: true,
			});

			await newUser.save();

			const jwt = jwtUtil.issueJWT(newUser);

			return res.json({ user: newUser, success: true, ...jwt });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.postUserLogin = [
	body('email').trim().isEmail().normalizeEmail(),
	body('password')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5')
		.matches('[0-9]')
		.withMessage('Must contain a number')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { email, password } = req.body;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ user: req.body, errors: formErrors.array() });
		}

		try {
			const user = await User.findOne({ email });

			if (!user) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'User with this email does not exist',
							param: 'email',
							value: email,
						},
					],
				});
			}

			const passwordMatch = await bcrypt.compare(password, user.password);

			if (!passwordMatch) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'Incorrect password',
							param: 'password',
							value: password,
						},
					],
				});
			}

			const jwt = jwtUtil.issueJWT(user);

			return res.json({ user, success: true, ...jwt });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeUser = [
	body('firstName').trim().notEmpty(),
	body('lastName').trim().notEmpty(),
	body('password')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5.')
		.matches('[0-9]')
		.withMessage('Must contain a number')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter'),
	body('newPassword')
		.isLength({ min: 5 })
		.withMessage('Minimum length is 5.')
		.matches('[0-9]')
		.withMessage('Must contain a number')
		.matches('[A-Z]')
		.withMessage('Must contain a capital letter')
		.optional({ checkFalsy: true }),
	body('newPasswordConfirmation')
		.custom((value, { req }) => value === req.body.newPassword)
		.withMessage('Must be identical to new password'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { firstName, lastName, password, newPassword } = req.body;
		const userId = req.user._id;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ user: req.body, errors: formErrors.array() });
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

			const passwordMatch = await bcrypt.compare(password, user.password);

			if (!passwordMatch) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'Incorrect password',
							param: 'password',
							value: password,
						},
					],
				});
			}

			const hashedPassword = newPassword
				? await bcrypt.hash(newPassword, 10)
				: user.password;

			await User.findByIdAndUpdate(userId, {
				firstName,
				lastName,
				password: hashedPassword,
			});

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deleteUser = async (req, res, next) => {
	try {
		const userId = req.user._id;

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

		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
};
