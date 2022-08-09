const mongoose = require('mongoose');

const { Schema } = mongoose;
const flavourSchema = new Schema({
	name: { type: String, required: true },
	description: String,
	imageId: String,
	imageUrl: String,
	monthlySpecial: { type: Boolean, default: false },
});

module.exports = mongoose.model('flavour', flavourSchema);
