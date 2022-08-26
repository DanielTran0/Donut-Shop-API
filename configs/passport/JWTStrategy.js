const passportJWT = require('passport-jwt');
const { isValidObjectId } = require('mongoose');
const User = require('../../models/user');

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const opts = {
	jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
	secretOrKey: process.env.JWT_SECRET,
};

const strategy = new JWTStrategy(opts, async (jwtPayload, done) => {
	const userId = jwtPayload._id;

	if (!isValidObjectId(userId)) {
		return done(null, false, { msg: 'Invalid user id' });
	}

	try {
		const user = await User.findById(jwtPayload._id);

		if (!user) return done(null, false, { msg: 'User does not exist' });

		return done(null, user);
	} catch (error) {
		return done(error);
	}
});

module.exports = (passport) => {
	passport.use(strategy);
};
