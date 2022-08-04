const mongoose = require('mongoose');

const { Schema } = mongoose;
const orderDateSchema = new Schema({
	date: { type: String, required: true },
	remainingOrders: { type: Number, required: true },
	dayOff: { type: Boolean, default: false },
	orderIds: [{ type: Schema.Types.ObjectId, ref: 'order' }],
});

module.exports = mongoose.model('orderDate', orderDateSchema);
