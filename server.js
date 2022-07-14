require('dotenv').config();
require('./configs/mongoDBConfig');
const createError = require('http-errors');
const app = require('./configs/appConfig');

app.use((req, res, next) => {
	next(createError(404));
});
