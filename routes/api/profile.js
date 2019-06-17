const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

const { check, validationResult } = require('express-validator/check');


// @route 	GET api/profile/me
// @desc 	Get current users profile based on ID
// @access 	PRIVATE

router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({user: req.user._id}).populate('user', ['name', 'avatar']);

		if (!profile) res.status(400).json({msg: 'There is no profile for this user'});
		res.json(profile);

	} catch(e) {
		console.log(e.message);
	}
});

// @route 	POST api/profile
// @desc 	Create or update a user profile
// @access 	PRIVATE

router.post('/', [auth, [
	check('status', 'Status is required').not().isEmpty(),
	check('skills', 'Skills are required').not().isEmpty()
	]], 
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty) return res.status(400).json({errors: errors.array()});

		const {
			company,
			website,
			location,
			bio,
			status,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin
		} = req.body;

		const profileFields = {};
		profileFields.user = req.user.id;

		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		
		if (skills) {
			// Expecting skills csv and removing spaces
			profileFields.skills = skills.split(',').map(skill => skill.trim());
		}

		profileFields.social = {};

		if (youtube) profileFields.social.youtube = youtube;
		if (facebook) profileFields.social.facebook = facebook;
		if (twitter) profileFields.social.twitter = twitter;
		if (instagram) profileFields.social.instagram = instagram;
		if (linkedin) profileFields.social.linkedin = linkedin;

		try {
			let profile = await Profile.findOne({user: req.user._id});

			if (profile) {
				profile = await	Profile.findOneAndUpdate({user: req.user._id}, {$set: profileFields}, {$new: true});
				return res.json(profile);
			}

			profile = new Profile(profileFields);
			await profile.save();

			return res.json(profile);
		} catch(e) {
			console.log(e);
			res.status(500).send('Server error');
		}

});

// @route 	GET api/profile
// @desc 	Get all profiles
// @access 	PUBLIC
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.json(profiles);

	} catch(e) {
		console.log(e.message);
		res.status(500).send('Server error');
	}
});

module.exports = router;