const { body, validationResult } = require('express-validator');
const multerUpload = require('../configs/multerConfig');
const Flavour = require('../models/flavour');
const cloudinaryUploadBuffer = require('../util/cloudinaryUploadBuffer');

module.exports.getAllFlavours = async (req, res, next) => {
	try {
		const flavours = await Flavour.find().sort({ name: 'asc' });
		res.json({ flavours });
	} catch (error) {
		next(error);
	}
};

module.exports.postCreatedFlavour = [
	multerUpload.single('image'),
	body('name').trim().escape().notEmpty(),
	body('description').trim().escape(),
	body('monthlySpecial')
		.trim()
		.escape()
		.custom((value) => ['true', 'false'].includes(value))
		.withMessage('true or false'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { name, description, monthlySpecial } = req.body;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}

		try {
			const flavourExist = await Flavour.findOne({ name });
			let cloudinaryRes = null;

			if (flavourExist) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'flavour already exists.',
							param: 'name',
							value: name,
						},
					],
				});
			}
			if (req.file) {
				cloudinaryRes = await cloudinaryUploadBuffer({
					req,
					folderName: 'flavours',
					fileName: name,
				});
			}

			const newFlavour = new Flavour({
				name,
				description,
				monthlySpecial,
				imageUrl: cloudinaryRes?.secure_url || '',
			});
			await newFlavour.save();

			return res.json({ ...newFlavour.coreDetails });
		} catch (error) {
			return next(error);
		}
	},
];
