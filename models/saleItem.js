const mongoose = require('mongoose');

const { Schema } = mongoose;
const saleItemSchema = new Schema({
	name: { type: String, required: true },
	description: String,
	price: { type: Number, required: true },
	quantity: { type: Number, required: true },
});

module.exports = mongoose.model('saleItem', saleItemSchema);
