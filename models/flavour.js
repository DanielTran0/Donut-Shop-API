const mongoose = require('mongoose');

const { Schema } = mongoose;
const flavourSchema = new Schema({
	name: { type: String, required: true },
	description: String,
	image: String,
	special: { type: Boolean, default: false },
});

module.exports = mongoose.model('flavour', flavourSchema);
