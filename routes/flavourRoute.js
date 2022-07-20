const express = require('express');
const flavourController = require('../controllers/flavourController');

const router = express.Router();

router.post('/', flavourController.postCreatedFlavour);

module.exports = router;
