const mongoose = require('mongoose');

const { Schema } = mongoose;
const userSchema = new Schema({
	email: { type: String, required: true },
	password: { type: String, required: true },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	isAdmin: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);
