require('dotenv').config();
require('./configs/mongoDBConfig');
require('./configs/cloudinaryConfig');
const createError = require('http-errors');
const app = require('./configs/appConfig');
const flavourRoute = require('./routes/flavourRoute');
const saleItemRoute = require('./routes/saleItemRoute');

app.use('/api/flavours', flavourRoute);
app.use('/api/saleItem', saleItemRoute);

app.use((req, res, next) => {
	next(createError(404));
});
