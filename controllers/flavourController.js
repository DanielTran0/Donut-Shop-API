const { body, validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const { isValidObjectId } = require('mongoose');
const multerUpload = require('../configs/multerConfig');
const Flavour = require('../models/flavour');
const cloudinaryUploadBuffer = require('../util/cloudinaryUploadBuffer');

module.exports.getAllFlavours = async (req, res, next) => {
	try {
		const flavours = await Flavour.find().sort({ name: 'asc' });

		res.json({ flavours, success: true });
	} catch (error) {
		next(error);
	}
};

module.exports.postCreatedFlavour = [
	multerUpload.single('image'),
	body('name').trim().escape().isAlphanumeric('en-US', { ignore: ' ' }),
	body('description')
		.trim()
		.escape()
		.optional({ checkFalsy: true })
		.isAlphanumeric('en-US', { ignore: ' ' }),
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
			const flavourExist = await Flavour.exists({ name });
			let cloudinaryRes = null;

			if (flavourExist) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'flavour already exists',
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
				});
			}

			const newFlavour = new Flavour({
				name,
				description,
				monthlySpecial,
				imageId: cloudinaryRes?.public_id || '',
				imageUrl: cloudinaryRes?.secure_url || '',
			});
			await newFlavour.save();

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeFlavour = [
	multerUpload.single('image'),
	body('name').trim().escape().isAlphanumeric('en-US', { ignore: ' ' }),
	body('description')
		.trim()
		.escape()
		.optional({ checkFalsy: true })
		.isAlphanumeric('en-US', { ignore: ' ' }),
	body('monthlySpecial')
		.trim()
		.escape()
		.custom((value) => ['true', 'false'].includes(value))
		.withMessage('true or false'),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { name, description, monthlySpecial } = req.body;
		const { flavourId } = req.params;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}
		if (!isValidObjectId(flavourId)) {
			return res.status(400).json({
				info: req.body,
				errors: [
					{
						msg: 'invalid flavour id',
						param: 'flavourId',
						value: flavourId,
					},
				],
			});
		}

		try {
			const flavour = await Flavour.findById(flavourId);
			let cloudinaryRes = null;

			if (!flavour) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'flavour does not exist',
							param: 'flavourId',
							value: flavourId,
						},
					],
				});
			}
			const { imageId, imageUrl } = flavour;

			if (req.file) {
				cloudinaryRes = await cloudinaryUploadBuffer({
					req,
					folderName: 'flavours',
				});

				await cloudinary.uploader.destroy(imageId);
			}

			await Flavour.findByIdAndUpdate(flavourId, {
				name,
				description,
				imageId: cloudinaryRes?.public_id || imageId,
				imageUrl: cloudinaryRes?.secure_url || imageUrl,
				monthlySpecial,
			});

			return res.json({ success: true });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deleteFlavour = async (req, res, next) => {
	try {
		const { flavourId } = req.params;

		if (!isValidObjectId(flavourId)) {
			return res.status(400).json({
				errors: [
					{
						msg: 'invalid flavour id',
						param: 'flavourId',
						value: flavourId,
					},
				],
			});
		}

		const flavour = await Flavour.findById(flavourId);

		if (!flavour) {
			return res.status(400).json({
				errors: [
					{
						msg: 'flavour does not exist',
						params: 'flavourId',
						value: flavourId,
					},
				],
			});
		}

		const { imageId } = flavour;

		if (imageId) await cloudinary.uploader.destroy(imageId);
		await Flavour.findByIdAndDelete(flavourId);

		return res.json({ success: true });
	} catch (error) {
		return next(error);
	}
};
