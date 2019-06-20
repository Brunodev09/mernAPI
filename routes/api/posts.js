const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

const { check, validationResult } = require('express-validator/check');

// @route 	POST api/posts
// @desc 	Create a post
// @access 	PRIVATE
router.post('/', [auth, [
	check('text', 'Body of comment is required').not().isEmpty()
	]], 
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) return res.status(400).json({msg: errors.array()});

		try {

			const user = await User.findById(req.user._id).select('-password');

			const newPost = new Post({
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user._id
			});

			const post = await newPost.save();

			res.json(post);

		} catch(e) {
			console.log(e);
			res.status(500).send('Server error');
		}
	});

// @route 	GET api/posts
// @desc 	Get all posts
// @access 	PRIVATE
router.get('/', auth, async (req, res) => {
	try {
		const posts = await Post.find().sort({date: -1});
		res.json(posts);
	} catch(e) {
		console.log(e);
		res.status(500).send('Server error');
	}
});

// @route 	GET api/posts/:id
// @desc 	Get a post from an id
// @access 	PRIVATE
router.get('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) return res.status(404).json({msg: 'Post not found with this ID!'});

		res.json(post);
	} catch(e) {
		console.log(e);
		res.status(500).send('Server error');
	}
});

// @route 	DELETE api/posts/:id
// @desc 	Deletes a post from an id
// @access 	PRIVATE
router.delete('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) return res.status(404).json({msg: 'Post not found'});

		if (post.user.toString() !== req.user._id) return res.status(401).json({msg: 'This user does not own this post!'});

		await post.remove();

		res.json({msg: 'Post removed'});
		
	} catch(e) {
		console.log(e);
		res.status(500).send('Server error');
	}
});

// @route 	PUT api/posts/like/:id
// @desc 	Like a post
// @access 	PRIVATE
router.put('/like/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) return res.status(404).json({msg: 'Post not found'});

		if (post.likes.filter(like => like.user.toString() === req.user._id).length > 0) {
			return res.status(400).json({msg: 'Post already liked by this user!'});
		}

		post.likes.unshift({user: req.user._id});

		await post.save();

		res.json(post.likes);

	} catch(e) {
		console.log(e);
		res.status(500).send('Server error');
	}
});

// @route 	PUT api/posts/unlike/:id
// @desc 	Unlike a post
// @access 	PRIVATE
router.put('/unlike/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		if (!post) return res.status(404).json({msg: 'Post not found'});

		if (post.likes.filter(like => like.user.toString() === req.user._id).length === 0) {
			return res.status(400).json({msg: 'Post has not been liked by this User yet!'});
		}

		const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user._id);

		post.likes.splice(removeIndex, 1);

		await post.save();

		res.json(post.likes);

	} catch(e) {
		console.log(e);
		res.status(500).send('Server error');
	}
});



// @route 	POST api/posts/comment/:id
// @desc 	Comment on a post
// @access 	PRIVATE
router.post('/comment/:id', [auth, [
	check('text', 'Body of comment is required').not().isEmpty()
	]], 
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) return res.status(400).json({msg: errors.array()});

		try {

			const user = await User.findById(req.user._id).select('-password');
			const post = await Post.findById(req.params.id);

			const newComment = {
				text: req.body.text,
				name: user.name,
				avatar: user.avatar,
				user: req.user._id
			};

			post.comments.unshift(newComment);

			await post.save();

			res.json(post.comments);

		} catch(e) {
			console.log(e);
			res.status(500).send('Server error');
		}
	});

// @route 	DELETE api/posts/comment/:id/:comment_id
// @desc 	Delete a comment from a post
// @access 	PRIVATE
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);

		const comment = post.comments.find(comment => comment._id.toString() === req.params.comment_id);

		if (!comment) return res.status(404).json({msg: 'Comment not found!'});

		if (comment.user.toString() !== req.user._id) return res.status(401).json({msg: 'This comment does not associate with this user!'});

		const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user._id);

		post.comments.splice(removeIndex, 1);

		await post.save();

		res.json(post.comments);


	} catch(e) {
		console.log(e);
		res.status(500).send('Server error');
	}
});

module.exports = router;