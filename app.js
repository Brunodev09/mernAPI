	const express = require('express');

	const app = express();

	const PORT = process.env.PORT || 3000;

	const config = require('./config/default.json');

	let mongoURI = config.mongoURI;

	// MongoDB settings and connection
	const mongoose = require("mongoose");

	(async () => {
		let connection;
		try {
			connection = await mongoose.connect(mongoURI, {
				useNewUrlParser: true,
				useCreateIndex: true
			});
			if (connection)	console.log('MongoDB is up and running...');
		} catch (e) {
			console.log(e);
			process.exit(1);
		}
	})();

	// Middleware
	app.use(express.json({ extended: false }));


	app.get('/', (req, res) => {
		res.send('API running');
	});

	// Defining routes from Router
	app.use('/api/users', require('./routes/api/users'));
	app.use('/api/posts', require('./routes/api/posts'));
	app.use('/api/profile', require('./routes/api/profile'));
	app.use('/api/auth', require('./routes/api/auth'));

	app.listen(PORT, () => {
		console.log(`Server is running at port ${PORT}`);
	});