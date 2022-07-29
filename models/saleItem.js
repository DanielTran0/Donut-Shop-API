const mongoose = require('mongoose');

const { Schema } = mongoose;
const saleItemSchema = new Schema({
	name: { type: String, required: true },
	description: String,
	price: { type: Number, required: true },
	quantity: { type: Number, required: true },
});

saleItemSchema.virtual('coreDetails').get(function getCoreDetails() {
	return {
		name: this.name,
		description: this.description,
		price: this.price,
		quantity: this.quantity,
	};
});

module.exports = mongoose.model('saleItem', saleItemSchema);
