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
			user : req.user, // get the user out of session and pass to template
			data: req.flash("data"),
			message: req.flash("message")
		});
	});
	app.post('/search', checkAuthenticated, async function(req, res) {
		
		let {id} = req.body;
		try {
			var supplier_phone = await sequelize.query("SELECT * FROM `Supplier Phone Number` WHERE supplier_id = ?" , 
										{replacements: [id] ,type: QueryTypes.SELECT})
			var supplier = await sequelize.query("SELECT * FROM Supplier WHERE id = ?" , {replacements: [id] ,type: QueryTypes.SELECT})
			// console.log(supplier_phone);
			// console.log(supplier);
			supplier = {...supplier, phone: supplier_phone[0].phone_number};
			const data = [supplier[0]];
			data[0]['phone'] = supplier_phone[0].phone_number;
			// console.log(data);
			req.flash('data',data);
			res.redirect('/search');
		} catch (err){
			console.log(err);
			req.flash('message',"Error");
			res.redirect('/search');
		}
		
	});
	// =====================================
	// UPDATE SECTION =========================
	// =====================================
	app.get('/update', checkAuthenticated, function(req, res) {
		res.render('update.ejs', {
			user : req.user, // get the user out of session and pass to template
			success: req.flash("success"),
			message: req.flash("message")
		});
	});
	app.post('/update', checkAuthenticated, async function(req, res) {
			let {name, phone, address, bank, taxcode} = req.body;
			data = [[name, address, bank, taxcode, null, null ]];
			try {
				// console.log(data);
				// THROW ERROR IF PHONE NUMBER IS EXIST IN TABLE
				var isPhoneExist = await sequelize.query("SELECT * FROM `Supplier Phone Number` WHERE phone_number = ?", 
										{replacements: [phone],type: QueryTypes.SELECT})
				console.log(isPhoneExist);
				if(isPhoneExist.length === 0){
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
				} else {
					throw "This phone numer has already existed in database!";
				}			
			} catch (err) {
				console.log(err.sqlMessage);
				req.flash('message',err);
				res.redirect('/update');
			}
			
		}
	);
	// =====================================
	// CATEGORY SECTION =========================
	// =====================================
	app.get('/category', checkAuthenticated, function(req, res) {
		res.render('category.ejs', {
			user : req.user, // get the user out of session and pass to template
			categories: req.flash("categories"),
			supplier: req.flash("supplier"),
			message: req.flash("message")
		});
	});
	app.post('/category', checkAuthenticated, async function(req, res) {
		let {id} = req.body;
		try {
				try {
					var supplier = await sequelize.query("SELECT * FROM Supplier WHERE id = ?" , 
								{replacements: [id] ,type: QueryTypes.SELECT});
					try {
						var categories = await sequelize.query("SELECT * FROM Category WHERE supplier_id = ?" , 
								{replacements: [id] ,type: QueryTypes.SELECT})
						req.flash('categories',categories)
						req.flash('supplier',supplier)
						res.redirect('/category');
					}catch (error){
						throw "This supplier does not provide any category!!!"
					}
				} catch (err){
					throw "This supplier does not exist in database!!!"
				}
		} catch (err) {
			console.log(err);
			req.flash('message',err);
			res.redirect('/category');
		}
		
	});
	
	// =====================================
	// ORDER SECTION =========================
	// =====================================
	app.get('/order', checkAuthenticated, function(req, res) {
		res.render('order.ejs', {
			user : req.user, // get the user out of session and pass to template
			data: req.flash("data"),
			main_order: req.flash("main_order"),
			message: req.flash("message")
		});
	});
	app.post('/order', checkAuthenticated, async function(req, res) {
		let {id} = req.body;
		console.log("ID: " + id);
		try {
				var data = {};
				//GET CUSTOMER INFORMATION
				const customer = await sequelize.query("SELECT * FROM Customer WHERE id = ?", 
				{replacements: [id] ,type: QueryTypes.SELECT} ) 
				const customer_phone = await sequelize.query("SELECT * FROM `Customer Phone Number` WHERE customer_id = ?", 
				{replacements: [id] ,type: QueryTypes.SELECT} )
				// If true, return Customer object (id, first_name, last_name, warning_flag, debt_amount,office_id, arrearage_id)
				data = {
					id_customer: customer[0].id,
					name_customer: customer[0].first_name + " " + customer[0].last_name,
					phone_customer: customer_phone[0].phone_number
				}
				// console.log("AFTER SELECT CUSTOMER: " + JSON.stringify(data));
				//GET ORDERS OF CUSTOMER
				const orders = await sequelize.query("SELECT * FROM Customer_order WHERE customer_id = ?",
									 {replacements: [data.id_customer] ,type: QueryTypes.SELECT} );
				// console.log("AFTER SELECT ORDER: " + JSON.stringify(orders));

				var main_order = await Promise.all(orders.map(async (item, index) => {
					
					//GET STATUS OF EACH ORDER
					var order_status = await sequelize.query("SELECT * FROM `Order Status` WHERE order_id = ?",
										{replacements: [item.id] ,type: QueryTypes.SELECT});
					// console.log("ORDER [" + index + "]: " + JSON.stringify(order_status));
					var bolts = await sequelize.query("SELECT * FROM `Bolt` WHERE order_id = ?",
										{replacements: [item.id] ,type: QueryTypes.SELECT});
					console.log("	BOLTS [" + index + "]: " + JSON.stringify(bolts));
					var category = await Promise.all(bolts.map(async (bolt, key) => {
						try {
							var categories = await sequelize.query("SELECT * FROM `Category` WHERE id = ?",
										{replacements: [bolt.category_id] ,type: QueryTypes.SELECT});
							console.log("		CATEGORY [" + key + "]: " + JSON.stringify(categories));
							return categories;
						} catch(err){
							throw "No category";
						}
						
						
					}))
					var date = order_status[0].date;
					var status = "";
					var cancel = {cancelled : "Cancelled",reason : order_status[0].cancellation_reason};
					if(order_status[0].is_new === 1) status = "New";
					else if(order_status[0].is_ordered === 1) status = "Ordered";
					else if(order_status[0].is_partial_paid === 1) status = "Partial Paid";
					else if(order_status[0].is_full_paid === 1) status = "Full Paid";
					return {item, status, bolts, category,cancel, date};

				}))

				// console.log(JSON.stringify(data));
				req.flash('data',data)
				req.flash('main_order',main_order)
				res.redirect('/order');
		} catch (err) {
			console.log(err.name);
			req.flash('message',err.name);
			res.redirect('/order');
		}
		
	});
};
