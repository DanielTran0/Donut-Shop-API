const mongoose = require('mongoose');

const { Schema } = mongoose;
const orderSchema = new Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, required: true },
	phone: { type: String, required: true },
	note: String,
	allergy: String,
	dateOrderPlaced: { type: String, required: true },
	timeOrderPlaced: { type: String, required: true },
	dateOrderPickUp: { type: String, required: true },
	timeOrderPickUp: { type: String, required: true },
	status: {
		type: String,
		enum: [
			'waiting for approval',
			'approved, waiting on payment',
			'approved and paid',
			'cancelled',
		],
		default: 'waiting for approval',
	},
	paid: { type: Boolean, default: false },
	orderItems: [
		{
			saleItem: {
				name: { type: String, required: true },
				price: { type: Number, required: true },
				quantity: { type: Number, required: true },
			},
			flavours: [
				{
					name: { type: String, required: true },
					quantity: { type: Number, required: true },
				},
			],
		},
	],
});

module.exports = mongoose.model('order', orderSchema);
