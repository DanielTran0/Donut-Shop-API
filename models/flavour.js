const mongoose = require('mongoose');

const { Schema } = mongoose;
const flavourSchema = new Schema({
	name: { type: String, required: true },
	description: String,
	imageUrl: String,
	monthlySpecial: { type: Boolean, default: false },
});

flavourSchema.virtual('coreDetails').get(function getCoreDetails() {
	return {
		_id: this._id,
		name: this.name,
		description: this.description,
		imageUrl: this.imageUrl,
		monthlySpecial: this.monthlySpecial,
	};
});

module.exports = mongoose.model('flavour', flavourSchema);
