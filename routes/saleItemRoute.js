const express = require('express');
const saleItemController = require('../controllers/saleItemController');
const authenticateRoute = require('../configs/passport/passportConfig');

const router = express.Router();

router.get('/', saleItemController.getAllSaleItems);

router.post('/', authenticateRoute, saleItemController.postCreatedSaleItem);

router.put(
	'/:saleItemId',
	authenticateRoute,
	saleItemController.putChangeSaleItem
);

router.delete(
	'/:saleItemId',
	authenticateRoute,
	saleItemController.deleteSaleItem
);

module.exports = router;
