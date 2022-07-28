const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const cloudinaryUploadBuffer = ({ req, folderName, fileName }) => {
	return new Promise((resolve, reject) => {
		const cloudUploadStream = cloudinary.uploader.upload_stream(
			{
				folder: folderName,
				public_id: fileName,
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
