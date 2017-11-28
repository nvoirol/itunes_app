
var pg = require('pg');
var inquirer = require('inquirer');

var dbUrl = {
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: 'itunes',
	host: 'localhost',
	port: 5432
};

var pgClient = new pg.Client(dbUrl);


console.log("Welcome to I Tunes app");
var signUp = () => {
	inquirer.prompt([
		{
			type: "input",
			message: "What is your username?",
			name: "username",
		},
		{
			type: "password",
			message: "What is your password?",
			name: "password",
		}
	]).then((res) => {
		var runThis = () => {
			pgClient.query(`SELECT * FROM users WHERE username='${res.username}'`, function(err, result) {
				if(result.rows.length > 0){
				    if(result.rows[0].password === res.password){
				    	var goBack = () => {
					    	inquirer.prompt([
						    	{
						    		type: "list",
									message: "Please Choose.",
									choices: ["View Your Songs", "Buy Songs"],
									name: "selection"
						    	}
					    	]).then(function(resTwo){
					    		if(resTwo.selection === "View Your Songs"){
							    	console.log("Welcome " + result.rows[0].name + ". Here are your songs.")
									pgClient.query('SELECT song_title.songs FROM songs INNER JOIN bought_products ON bought_products.song_id=song.id WHERE bought_products.user_id=' + result.rows[0].id, (error,queryResTwo) => {
										if(queryResTwo.rows.length > 0){
											for(var i = 0; i < queryResTwo.rows.length; i++){
												console.log((i + 1) + ". " + queryResTwo.rows[i].product)
											}
											goBack();
										} else {
											console.log("You haven't bought anything");
											goBack();
										}
									});
								} else {
									pgClient.query("SELECT * FROM songs", (errThree, queryResThree) => {
										var products = [];
										queryResThree.rows.forEach((p) => {
											products.push(p.product);
										})
									    inquirer.prompt([
										    {
									    		type: "input",
												message: "Please Choose a Song?",
												name: "songs"
									    	}
									    ]).then(function(prod){
									    	var product_id;
										    queryResThree.rows.forEach((p) => {
												if(p.product === prod.product){
													product_id = p.id
												}
											})
									    	pgClient.query("INSERT INTO bought_products (user_id, product_id) VALUES ($1,$2)", [result.rows[0].id, product_id], (errFour, resFour) => {
									    		if(errFour) throw errFour;
									    		console.log("Product Bought");
									    		goBack();
									    	})
									    })
									})
								}
							});
						}
						goBack();
				    } else {
				    	console.log("Incorrect Password");
				    	signUp();
				    }
				} else {
					console.log("Username doesn't exist");
					signUp();
				}
			});
		}
		runThis();
	});
}
signUp();