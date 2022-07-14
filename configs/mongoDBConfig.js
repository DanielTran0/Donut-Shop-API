const mongoose = require('mongoose');

const dbUrl = process.env.DB_URL || process.env.DB_DEV_URL;

mongoose.connect(dbUrl);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
