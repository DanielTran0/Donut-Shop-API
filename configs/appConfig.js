const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use(cors({ origin: process.env.CLIENT_SITE || 'http://localhost:3000/' }));
app.use(compression());
app.use(helmet());

app.get('/', (req, res) => {
	res.json({ msg: 'This is a api server, use /api/resource' });
});

app.listen(port, () => {
	console.log(`App running on port ${port}`);
});

module.exports = app;
