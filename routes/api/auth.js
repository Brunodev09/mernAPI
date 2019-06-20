const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const path = require('path');
const User = require('../../models/User');

const jwt = require('jsonwebtoken');
const config = require('../../config/default');
const { check, validationResult } = require('express-validator/check');
const bcryptjs = require('bcryptjs');



// @route 	GET api/auth
// @desc 
// @access 	PROTECTED

router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select('-password');
		if (user) res.json(user);

	} catch(e) {
		console.log(e.message);
		return res.status(500).send('Server error in ' +  path.basename(__filename));	
	}
});



// @route 	POST api/auth
// @desc 	Authenticate a user
// @access 	PUBLIC

router.post('/', [
	check('email', 'Please enter a valid email address').isEmail(),
	check('password', 'Password is required').exists()
	], 

	async (req, res) => {	

		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({errors: errors.array()});
		}

		const { email, password } = req.body;

		try {
			let user = await User.findOne({ email: email });

			if (!user) {
				return res.status(400).json( { errors: [{msg: 'There is no user with this credentials!'}] });
			}

			const isMatch = await bcryptjs.compare(password, user.password);

			if (!isMatch) return res.status(400).json({ errors: [{msg: 'Incorrect credentials for this user!'}]});


			const payload = {
				user: user
			};
			// Must remember to expire in 3600s after deployment
			jwt.sign(payload, config.jwtSecret, {expiresIn: 360000}, (err, token) => {
				if (err) throw err;
				res.status(200).json({token});
			});

		} catch(e) {
			console.log(e.message);
			res.status(500).send('Server error!');
		}


	});

module.exports = router;