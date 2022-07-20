require('dotenv').config();
require('./configs/mongoDBConfig');
const createError = require('http-errors');
const app = require('./configs/appConfig');
const flavourRoute = require('./routes/flavourRoute');

app.use('/api/flavours', flavourRoute);

app.use((req, res, next) => {
	next(createError(404));
});
