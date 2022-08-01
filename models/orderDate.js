const mongoose = require('mongoose');

const { Schema } = mongoose;
const orderDateSchema = new Schema({
	date: { type: Date, required: true },
	dateFormatted: { type: String, required: true },
	remainingOrders: { type: Number, required: true },
	dayOff: { type: Boolean, default: false },
});

module.exports = mongoose.model('orderDate', orderDateSchema);
