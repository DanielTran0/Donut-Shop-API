const { body, validationResult } = require('express-validator');
const Flavour = require('../models/flavour');

module.exports.postCreatedFlavour = [
	body('name').trim().escape().notEmpty(),
	body('description').trim().escape(),
	body('image').trim().escape(),
	body('special')
		.trim()
		.escape()
		.custom((value) => ['true', 'false'].includes(value))
		.withMessage('true or false'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { name, description, image, special } = req.body;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}

		try {
			const flavourExist = await Flavour.findOne({ name });

			if (flavourExist) {
				return res.status(400).json({
					location: 'body',
					msg: 'flavour  already exists.',
					param: 'name',
					value: name,
				});
			}

			const newFlavour = new Flavour({ name, description, image, special });
			await newFlavour.save();
		} catch (error) {
			next(error);
		}

		return res.json({ info: req.body });
	},
];
