const multer = require('multer');

const storage = multer.memoryStorage();
const multerUpload = multer({ storage, limits: { fileSize: 5000000 } });

module.exports = multerUpload;
