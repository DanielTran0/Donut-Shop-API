const jsonwebtoken = require('jsonwebtoken');

const issueJWT = (user) => {
	const { _id } = user;
	const expiresIn = '14d';
	const payload = { _id, iat: Date.now() };
	const signedToken = jsonwebtoken.sign(payload, process.env.JWT_SECRET, {
		expiresIn,
	});

	return {
		token: `Bearer ${signedToken}`,
		expires: expiresIn,
	};
};

module.exports.issueJWT = issueJWT;
