const { body, validationResult } = require('express-validator');
const SaleItem = require('../models/saleItem');

module.exports.getAllSaleItems = async (req, res, next) => {
	try {
		const saleItems = await SaleItem.find().sort({ name: 'asc' });
		res.json({ saleItems });
	} catch (error) {
		next(error);
	}
};

module.exports.postCreatedSaleItem = [
	body('name').trim().escape().notEmpty(),
	body('description').trim().escape(),
	body('price').trim().escape().isNumeric(),
	body('quantity').trim().escape().isNumeric(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { name, description, price, quantity } = req.body;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}
		try {
			const saleItemExist = await SaleItem.exists({ name });

			if (saleItemExist) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							location: 'body',
							msg: 'sale item already exists',
							param: 'name',
							value: name,
						},
					],
				});
			}

			const newSaleItem = new SaleItem({
				name,
				description,
				price,
				quantity,
			});
			await newSaleItem.save();

			return res.json({ msg: 'successful' });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.putChangeSaleItem = [
	body('name').trim().escape().notEmpty(),
	body('description').trim().escape(),
	body('price').trim().escape().isNumeric(),
	body('quantity').trim().escape().isNumeric(),
	async (req, res, next) => {
		const formErrors = validationResult(req);
		const { name, description, price, quantity } = req.body;
		const { saleItemId } = req.params;

		if (!formErrors.isEmpty()) {
			return res
				.status(400)
				.json({ info: req.body, errors: formErrors.array() });
		}

		try {
			const saleItem = await SaleItem.findById(saleItemId);

			if (!saleItem) {
				return res.status(400).json({
					info: req.body,
					errors: [
						{
							msg: 'sale item does not exist',
							param: 'saleItemId',
							value: saleItemId,
						},
					],
				});
			}

			await SaleItem.findByIdAndUpdate(saleItemId, {
				name,
				description,
				price,
				quantity,
			});

			return res.json({ msg: 'successful' });
		} catch (error) {
			return next(error);
		}
	},
];

module.exports.deleteSaleItem = async (req, res, next) => {
	try {
		const { saleItemId } = req.params;
		const saleItemExist = await SaleItem.findById(saleItemId);

		if (!saleItemExist) {
			return res.status(400).json({
				errors: [
					{
						msg: 'sale item does not exist',
						param: 'saleItemId',
						value: saleItemId,
					},
				],
			});
		}

		await SaleItem.findByIdAndDelete(saleItemId);

		return res.json({ msg: 'successful' });
	} catch (error) {
		return next(error);
	}
};
