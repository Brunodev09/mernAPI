const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const path = require('path');
const User = require('../../models/User');

// @route 	GET api/auth
// @desc 
// @access 	PROTECTED

router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user).select('-password');
		if (user) res.json(user);

	} catch(e) {
		console.log(e.message);
		return res.status(500).send('Server error in ' +  path.basename(__filename));	
	}
});

module.exports = router;