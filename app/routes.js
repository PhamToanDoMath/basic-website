const {checkNotAuthenticated, checkAuthenticated} = require('./../middlewares/check_admin')
const sequelize = require('./../config/sequelize')
const { QueryTypes } = require('sequelize')
// app/routes.js
module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs'); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', checkNotAuthenticated, function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login',checkNotAuthenticated, passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            console.log("hello");

            if (req.body.remember) {
              req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
              req.session.cookie.expires = false;
            }
        res.redirect('/');
    });

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup',checkNotAuthenticated, function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup',checkNotAuthenticated, passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', checkAuthenticated,async function(req, res) {
		var users = await sequelize.query("SELECT * FROM Manager",{type: QueryTypes.SELECT})
		res.render('profile.ejs', {
			users : users
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	// =====================================
	// SEARCH SECTION =========================
	// =====================================
	app.get('/search', checkAuthenticated, function(req, res) {
		res.render('search.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});
	app.post('/search', checkAuthenticated, function(req, res) {
		let {name} = req.body;
		let errors = [];
		// console.log(name);
	});
	// =====================================
	// UPDATE SECTION =========================
	// =====================================
	app.get('/update', checkAuthenticated, function(req, res) {
		res.render('update.ejs', {
			user : req.user, // get the user out of session and pass to template
			success: req.flash("success")
		});
	});
	app.post('/update', checkAuthenticated, async function(req, res) {
			let {name, phone, address, bank, taxcode} = req.body;
			data = [[name, address, bank, taxcode, 65, 56 ]];		
			// console.log(data);
			var supplier = await sequelize.query("INSERT INTO Supplier (name, address, bank_account, tax_code, agent_id, partner_id) VALUES ?",
												{replacements: [data],type: QueryTypes.INSERT})
			var id = supplier[0];
			console.log(supplier);
			data_phone = [[id, phone]];			
			var supplier = await sequelize.query("INSERT INTO `Supplier Phone Number` (supplier_id,phone_number) VALUES ?",
												{replacements: [data_phone],type: QueryTypes.INSERT})
			console.log(supplier)
			req.flash('success',true);
			res.redirect('/update');	
			// connection.query("INSERT INTO Supplier (name, address, bank_account, tax_code, agent_id,partner_id) VALUES ?", [data], function(err, rs){
			// 	if (err) throw err;
			// 	else {
			// 		// console.log("Number of records inserted in supplier: " + rs.affectedRows);
			// 		// console.log("ID SUPLLIER: " + rs.insertId);
			// 		data_phone = [[rs.insertId, phone]];
			// 		connection.query("INSERT INTO `Supplier Phone Number` (supplier_id,phone_number) VALUES ?", [data_phone], function(err, result){
			// 			if(err) throw err;
			// 			else {
			// 				req.flash('success',true)
			// 				res.redirect('/update');
			// 				console.log("Number of records inserted in supplier phone number: " + rs.affectedRows);
			// 			}
			// 		})
			// 	}
			// })
		}
	);
	// =====================================
	// CATEGORY SECTION =========================
	// =====================================
	app.get('/category', checkAuthenticated, function(req, res) {
		// connection.query("SELECT * FROM Category",  function(err, rows) {
		// 	if(err){
		// 		console.log(err)
		// 	} else {
		// 		console.log(rows);
		// 		res.render('category.ejs', {categories: rows, user : req.user })
		// 	}
		// })
		res.render('category.ejs', {
			user : req.user, // get the user out of session and pass to template
			categories: req.flash("categories")
		});
	});
	app.post('/category', checkAuthenticated, function(req, res) {
		let {id} = req.body;
		console.log(id);
		connection.query("SELECT * FROM Category WHERE supplier_id = ?", [id], function(err, result){
			if(err) console.log(err);
			else {
			
				// console.log(categories);
				req.flash('categories',result)
			}
			res.redirect('/category');
			
		})
	});
	
	// =====================================
	// ORDER SECTION =========================
	// =====================================
	app.get('/order', checkAuthenticated, function(req, res) {
		res.render('order.ejs', {
			user : req.user // get the user out of session and pass to template
		});
	});
};
