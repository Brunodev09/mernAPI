const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config/default');
const { check, validationResult } = require('express-validator/check');

const User = require('../../models/User');

// @route 	GET api/users
// @desc 
// @access 	PUBLIC

router.post('/', [
	
	check('name', 'Name is required').not().isEmpty(), 
	check('email', 'Please enter a valid email address').isEmail(),
	check('password', 'Enter a password with 6 or more chars').isLength({ min: 6 })
	], 

	async (req, res) => {	

		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password } = req.body;

		try {
			let user = await User.findOne({ email: email });

			if (user) {
				return res.status(400).json( { errors: [{msg: 'User already exists!'}] } );
			}

			const avatar = gravatar.url(email, {s: '200', r: 'pg', d: 'mm'});

			user = new User({name, email, avatar, password});

			const salt = await bcryptjs.genSalt(10);

			user.password = await bcryptjs.hash(password, salt);

			await user.save();

			const payload = {
				user: user.id
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

