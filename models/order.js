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
	cancelDate: { type: String, default: '' },
	cancelTime: { type: String, default: '' },
	status: {
		type: String,
		enum: [
			'Waiting for Approval',
			'Approved, Waiting on Payment',
			'Approved and Paid',
			'Cancelled',
			'Completed',
		],
		default: 'Waiting for Approval',
	},
	orderItems: [
		{
			saleItem: {
				name: { type: String, required: true },
				price: { type: Number, required: true },
				quantity: { type: Number, required: true },
				amount: { type: Number, required: true },
			},
			flavours: [
				{
					name: { type: String, required: true },
					quantity: { type: Number, required: true },
				},
			],
		},
	],
	totalCost: { type: Number, required: true },
	paid: { type: Boolean, default: false },
});

module.exports = mongoose.model('order', orderSchema);
