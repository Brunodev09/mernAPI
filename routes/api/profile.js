const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const config = require('../../config/default');

const request = require('request');

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
		profileFields.user = req.user._id;

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
// @desc 	Get profile by user_id
// @access 	PUBLIC
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({user: req.params.user._id}).populate('user', ['name', 'avatar']);
		
		if (!profile) return res.status(400).json({msg: 'There is no profile associated with this user!'});

		res.json(profile);

	} catch(e) {
		console.log(e.message);
		res.status(500).send('Server error');
	}
});

// @route 	DELETE api/profile
// @desc 	Delete profile user and posts
// @access 	PRIVATE
router.delete('/', auth, async (req, res) => {
	try {
		await Profile.findOneAndRemove({user: req.user._id});

		await User.findOneAndRemove({_id: req.user._id});

		res.json({msg: 'User removed!'});

	} catch(e) {
		console.log(e.message);
		res.status(500).send('Server error');
	}
});

// @route 	PUT api/profile/experience
// @desc 	Add profile experience
// @access 	PRIVATE
router.put('/experience', [auth, [
	check('title', 'Title is required!').not().isEmpty(),
	check('company', 'Company is required!').not().isEmpty(),
	check('from', 'Date is required!').not().isEmpty()
	]], 
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		} = req.body

		const newExp = {
			title: title,
			company: company,
			location: location,
			from: from,
			to: to,
			current: current,
			description: description
		}

		try {
			// Using findOne instead of Update in this case is a good example of why using a NoSQL database can be beneficial
			// My experience array will have its own _id even though its contained within the Profile collection
			const profile = await Profile.findOne({user: req.user._id});

			profile.experience.unshift(newExp);
			await profile.save();

			res.json(profile);
		} catch(e) {
			console.log(e);
			res.status(500).send('Server error');
		}
});

// @route 	DELETE api/profile/experience/:exp_id
// @desc 	Delete an experience array from Profile
// @access 	PRIVATE
router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({user: req.user._id});

		const removeIndex = profile.experience.map(item => item._id).indexOf(req.params.exp_id);

		profile.experience.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);

	} catch(e) {
		console.log(e);
		res.status(500).send('Server error');
	}
});



// @route 	PUT api/profile/education
// @desc 	Add profile education
// @access 	PRIVATE
router.put('/education', [auth, [
	check('school', 'School is required!').not().isEmpty(),
	check('degree', 'Degree is required!').not().isEmpty(),
	check('from', 'From date is required!').not().isEmpty()
	]], 
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()})

		const {
			school,
			degree,
			from,
			to,
			current,
			description
		} = req.body

		const newEdu = {
			school: school,
			degree: degree,
			from: from,
			to: to,
			current: current,
			description: description
		}

		try {
			// Using findOne instead of Update in this case is a good example of why using a NoSQL database can be beneficial
			// My experience array will have its own _id even though its contained within the Profile collection
			const profile = await Profile.findOne({user: req.user._id});

			profile.education.unshift(newEdu);
			await profile.save();

			res.json(profile);
		} catch(e) {
			console.log(e);
			res.status(500).send('Server error');
		}
});


// @route 	DELETE api/profile/education/:edu_id
// @desc 	Delete an education array from Profile
// @access 	PRIVATE
router.delete('/education/:edu_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({user: req.user._id});

		const removeIndex = profile.education.map(item => item._id).indexOf(req.params.edu_id);

		profile.education.splice(removeIndex, 1);

		await profile.save();

		res.json(profile);

	} catch(e) {
		console.log(e);
		res.status(500).send('Server error');
	}
});

// @route 	GET api/profile/github/:username
// @desc 	Get user repo from Github
// @access 	PUBLIC
router.get('/github/:username', async (req, res) => {
	try {
		const opt = {
			uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.githubClientId}&client_secret=${config.githubClientSecret}`,
			method: 'GET',
			headers: {'user-agent': 'node.js'}
		}
		request(opt, (err, response, body) => {
			if (err) console.log(err);

			if (response.statusCode !== 200) return res.status(404).json({msg: 'No Github profile found with the username provided!'});

			res.json(JSON.parse(body));
		});
	} catch(e) {
		console.log(e);
		res.status(400).send('Server error');
	}
});


module.exports = router;