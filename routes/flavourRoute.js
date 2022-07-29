const express = require('express');
const flavourController = require('../controllers/flavourController');

const router = express.Router();
router.get('/', flavourController.getAllFlavours);
router.post('/', flavourController.postCreatedFlavour);
router.put('/:flavourId', flavourController.putChangeFlavour);
router.delete('/:flavourId', flavourController.deleteFlavour);

module.exports = router;
