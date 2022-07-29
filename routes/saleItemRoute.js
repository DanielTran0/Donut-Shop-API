const express = require('express');
const saleItemController = require('../controllers/saleItemController');

const router = express.Router();
router.get('/', saleItemController.getAllSaleItems);
router.post('/', saleItemController.postCreatedSaleItem);
router.put('/:saleItemId', saleItemController.putChangeSaleItem);
router.delete('/:saleItemId', saleItemController.deleteSaleItem);

module.exports = router;
