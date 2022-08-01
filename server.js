require('dotenv').config();
require('./configs/mongoDBConfig');
require('./configs/cloudinaryConfig');
const createError = require('http-errors');
const app = require('./configs/appConfig');
const flavourRoute = require('./routes/flavourRoute');
const saleItemRoute = require('./routes/saleItemRoute');
const orderDateRoute = require('./routes/orderDateRoute');

app.use('/api/flavour', flavourRoute);
app.use('/api/saleItem', saleItemRoute);
app.use('/api/orderDate', orderDateRoute);

app.use((req, res, next) => {
	next(createError(404));
});
