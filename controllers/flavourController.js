const { body, validationResult } = require('express-validator');
const Flavour = require('../models/flavour');
const cloudinaryUploader = require('../configs/cloudinaryConfig');
const multerUpload = require('../configs/multerConfig');
const parser = require('../configs/datauriConfig');

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
			return res.status(400).json({ errors: formErrors.array() });
		}

		try {
			const flavourExist = await Flavour.findOne({ name });
			let imageUrl = '';

			if (flavourExist) {
				// return res.status(400).json({
				// 	errors: [
				// 		{
				// 			location: 'body',
				// 			msg: 'flavour already exists.',
				// 			param: 'name',
				// 			value: name,
				// 		},
				// 	],
				// });
			}
			if (req.file) {
				const file = parser.format(name, req.file.buffer);
				await cloudinaryUploader.upload(
					file.content,
					{ folder: 'flavours' },
					(cloudErr, cloudRes) => {
						if (cloudErr) {
							console.log(cloudErr.message);
						}

						imageUrl = cloudRes.url;
					}
				);
			}

			const newFlavour = new Flavour({
				name,
				description,
				imageUrl,
				monthlySpecial,
			});
			await newFlavour.save();

			return res.json({ name, description, imageUrl, monthlySpecial });
		} catch (error) {
			return next(error);
		}
	},
];
