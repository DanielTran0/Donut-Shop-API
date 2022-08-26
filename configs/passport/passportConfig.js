const passport = require('passport');
require('./JWTStrategy')(passport);

const authenticateRoute = passport.authenticate('jwt', { session: false });

module.exports = authenticateRoute;
