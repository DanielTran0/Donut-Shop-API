const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

const generateImageName = (req) => {
	return `${req.body.name}-${Date.now()}`;
};

const streamUpload = (req) => {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{
				folder: 'Flavours',
				public_id: generateImageName(req),
			},
			(error, result) => {
				if (result) resolve(result);

				reject(error);
			}
		);

		streamifier.createReadStream(req.file.buffer).pipe(stream);
	});
};

module.exports = { streamUpload, cloudinary };
