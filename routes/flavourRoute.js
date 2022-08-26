const express = require('express');
const flavourController = require('../controllers/flavourController');
const authenticateRoute = require('../configs/passport/passportConfig');

const router = express.Router();

router.get('/', flavourController.getAllFlavours);

router.post('/', authenticateRoute, flavourController.postCreatedFlavour);

router.put(
	'/:flavourId',
	authenticateRoute,
	flavourController.putChangeFlavour
);

router.delete(
	'/:flavourId',
	authenticateRoute,
	flavourController.deleteFlavour
);

module.exports = router;
