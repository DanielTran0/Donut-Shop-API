const mongoose = require('mongoose');

const { Schema } = mongoose;
const orderSchema = new Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	phone: { type: String, required: true },
	orderDate: { type: Date, default: Date.now },
	pickUpDate: { type: Date, required: true },
	accepted: { type: Boolean, default: false },
	paid: { type: Boolean, default: false },
	orderItems: [
		{
			saleItem: { type: String, required: true },
			price: { type: Number, required: true },
			quantity: { type: Number, required: true },
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
