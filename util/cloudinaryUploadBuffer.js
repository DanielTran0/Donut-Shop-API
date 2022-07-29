const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const cloudinaryUploadBuffer = ({ req, folderName }) => {
	return new Promise((resolve, reject) => {
		const cloudUploadStream = cloudinary.uploader.upload_stream(
			{
				folder: folderName,
				use_filename: true,
				overwrite: true,
			},
			(err, res) => {
				if (err) return reject(err);

				return resolve(res);
			}
		);

		streamifier.createReadStream(req.file.buffer).pipe(cloudUploadStream);
	});
};

module.exports = cloudinaryUploadBuffer;
