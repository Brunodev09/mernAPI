const jwt = require('jsonwebtoken');
const config = require('../config/default');

module.exports = function(req, res, next) {
	// x-auth-token --> name of the header param
	const token = req.header('x-auth-token');

	if (!token) return res.status(401).json({msg: 'No token provided!'});

	try {
		const decoded = jwt.verify(token, config.jwtSecret);

		req.user = decoded.user;
		next();

	} catch(e) {
		return res.status(401).json('Token invalid!');
	}
}
