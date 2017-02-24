var express = require('express');
var router = express.Router();
var passport = require('passport');
var execFile = require('child_process').execFile;
var execFileSync = require('child_process').execFileSync;
var spawn = require('child_process').spawn;
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

var User = require('../models/user.js');
// Results schema/model
var Result = require('../models/result.js');

var username = '';

router.post('/register', function (req, res) {
	User.register(new User({username: req.body.username}),
		req.body.password, function (err, account) {
			if (err) {
				return res.status(500).json({
					err: err
				});
			}
			passport.authenticate('local')(req, res, function () {
				return res.status(200).json({
					status: 'Registration successful!'
				});
			});
		});
});

router.post('/login', function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return res.status(401).json({
				err: info
			});
		}
		req.logIn(user, function (err) {
			if (err) {
				return res.status(500).json({
					err: 'Could not log in user'
				});
			}
			res.status(200).json({
				status: 'Login successful!'
			});
			username = user;
		});
	})(req, res, next);
});

// Perform action upon call to charge
router.post('/baseCharge', function (req, res) {
	console.log("Got from browser for charging - " + "current: " + req.body.current + "time : " + req.body.time);

	//  Pass the current and time values to the exe and perform charge
	var current = req.body.current || 2;
	var time = req.body.time || 1800;
	var name = req.body.name || current + 'C' + time;

	var basechargeSimulation = function (current, time, name) {
		//console.log("Starting exe");
		//console.log(__dirname);
		var homePath = __dirname.slice(0, -6);
		//console.log("Homepath", homePath);
		var cmd = homePath + 'exe/Eg-C.exe';
		var cwd = homePath + 'exe';
		var final_time_path = homePath + 'exe/final_time.txt';
		var bounds_path = homePath + 'exe/bounds.txt';
		var scaleparam_path = homePath + 'exe/scaleparam.txt';
		var data_path = homePath + 'exe/data.txt';
		var obj_path = homePath + 'exe/obj_val.txt';

		// Updating the bounds file
		var arr_bound = [];
		var bound_count = 1;
		var scale_count = 1;
		var data_count = 1;
		var bound_writeString = "0" + "\t\t" + current * 18;

		var index_temp = 12; // 13 in maple
		var index_fade = 13;
		var index_voltage = 14;
		var index_current = 31;
		var index_soc = 9;
		var node_points = 100; // predecided in maple

		fs.readFileSync(bounds_path).toString().split("\n").forEach(function (bound_line) {
			//console.log("Reading bounds file" + bound_line);
			arr_bound.push(bound_line);
			bound_count = bound_count + 1;
			if (bound_count == 32) {
				arr_bound.push(bound_writeString);
				var bound_writeText = arr_bound.join("\n");

				try {
					fs.writeFileSync(bounds_path, bound_writeText);
				}
				catch (er) {
					console.log("Error in writing to the bounds file");
					process.exit(1);
				}
			}
		});
		// Write time to the final time file.
		fs.writeFileSync(final_time_path, time);

		try {
			var output = execFileSync(cmd, {cwd: cwd}).toString();
			//console.log("output of the simulation -------------------------------" + "\n\n" + output);
		}

		catch (er) {
			console.log("There was an error " + er.file + er.pid + er.status);
			process.exit(1);
		}
		// Extract results
		var chargeStored = fs.readFileSync(obj_path).toString().replace(/\r?\n|\r/, "") * time * (-1)/3600;
		// Extract scaleparams into an array


		var arr_scale = [];

		fs.readFileSync(scaleparam_path).toString().split("\n").forEach(function (scale_line) {
			//console.log("Reading scaleparams :" +  scale_line);
			arr_scale.push(scale_line);
			scale_count = scale_count + 1;
			if (scale_count == 33) {
				//console.log("Read all the scale params");

				// Extract data into an array

				var arr_data = [];

				fs.readFileSync(data_path).toString().split("\n").forEach(function (data_line) {
					//console.log("Reading data :" + data_line)
					arr_data.push(data_line);
					data_count = data_count + 1;
					if (data_count == 32 * node_points + 1) {
						//console.log("Read all the data");

						var result_data = [];

						// parse the data array to get relevant results
						for (var i = 1; i <= node_points; i++) {
							result_data.push({
								timeVal: i * time / node_points,
								tempVal: arr_scale[index_temp] * arr_data[i + node_points * (index_temp) - 1],
								fadeVal: -1 * arr_scale[index_fade] * arr_data[i + node_points * (index_fade) - 1],
								voltageVal: arr_scale[index_voltage] * arr_data[i + node_points * (index_voltage) - 1],
								currentVal: arr_scale[index_current] * arr_data[i + node_points * (index_current) - 1],
								socVal: ((100 * arr_scale[index_soc] * arr_data[i + node_points * (index_soc) - 1]) / 30555 - 0.259) / (0.99 - 0.259)    // soc calculation is subjective to battery parameters
							});
						}
						var result = {
							result_data : result_data,
							charge_stored : chargeStored
						};

						// send the data to the client
						res.status(200).json(result);

						var result1 = new Result({
							username: username.username,
							name: name,
							current: current,
							time: time,
							data: result_data
						});

						result1.save(function (err) {
							if (err) {
								console.log("Error in saving to database");
								//return handleError(err);
							}
						});

					}
				});
			}
		});
	}

	// TODO: Handle connection timeouts and other reasons that can cause server crash
	basechargeSimulation(current, time, name);
});

// Perform action upon call to charge
router.post('/optimalCharge', function (req, res) {
	console.log("Got from browser for charging - " + "current: " + req.body.current + "time : " + req.body.time);

	//  Pass the current and time values to the exe and perform charge
	var current = req.body.current || 2;
	var time = req.body.time || 1800;
	var name = req.body.name || current + 'C' + time;

	var optimalchargeSimulation = function (current, time, name) {
		//console.log("Starting exe");
		//console.log(__dirname);
		var homePath = __dirname.slice(0, -6);
		//console.log("Homepath", homePath);
		var cmd = homePath + 'exe/Eg-C.exe';
		var cwd = homePath + 'exe';
		var final_time_path = homePath + 'exe/final_time.txt';
		var bounds_path = homePath + 'exe/bounds.txt';
		var scaleparam_path = homePath + 'exe/scaleparam.txt';
		var data_path = homePath + 'exe/data.txt';
		var discharge_path = homePath + 'exe/ics_discharge.txt';
		var obj_path = homePath + 'exe/obj_val.txt';

		// Updating the bounds file
		var arr_bound = [];
		var bound_count = 1;
		var scale_count = 1;
		var data_count = 1;
		var discharge_count = 1;
		var current_bound = "0" + "\t\t" + (current * 18 + 5);     // The optimal charge current bound
		var fade_limits = [];
		var fade_lower = " ";
		var fade_upper = " ";
		var fade_line = " ";
		var fade_lower_bound = 0;

		var index_temp = 12; // 13 in maple
		var index_fade = 13;
		var index_voltage = 14;
		var index_current = 31;
		var index_soc = 9;
		var node_points = 100; // predecided in maple

		fs.readFileSync(discharge_path).toString().split("\n").forEach(function (discharge_line) {
			discharge_count = discharge_count + 1;
			if (discharge_count == 15) {
				fade_lower_bound = discharge_line.toString().replace(/\r?\n|\r/, "");
			}
		});

		fs.readFileSync(bounds_path).toString().split("\n").forEach(function (bound_line) {
			//console.log("Reading bounds file" + bound_line);
			if (bound_count == 14) {
				fade_limits = bound_line.split(/\b(\s)/);
				console.log("Fade_limits" + fade_limits);
				fade_line = fade_lower_bound + "\t" + fade_limits[2] + "\r";
				arr_bound.push(fade_line);
			}

			else if (bound_count == 32) {
				arr_bound.push(current_bound);
				var bound_writeText = arr_bound.join("\n");

				try {
					fs.writeFileSync(bounds_path, bound_writeText);
				}
				catch (er) {
					console.log("Error in writing to the bounds file");
					process.exit(1);
				}
			}
			else {
				arr_bound.push(bound_line);
			}
			bound_count = bound_count + 1;

		});
		// Write time to the final time file.
		fs.writeFileSync(final_time_path, time);

		try {
			var output = execFileSync(cmd, {cwd: cwd}).toString();
			//console.log("output of the simulation -------------------------------" + "\n\n" + output);
		}

		catch (er) {
			console.log("There was an error " + er.file + er.pid + er.status);
			process.exit(1);
		}
		// Extract results

		var chargeStored = fs.readFileSync(obj_path).toString().replace(/\r?\n|\r/, "") * time * (-1)/3600;
		// Extract scaleparams into an array

		var arr_scale = [];

	fs.readFileSync(scaleparam_path).toString().split("\n").forEach(function (scale_line) {
			//console.log("Reading scaleparams :" +  scale_line);
			arr_scale.push(scale_line);
			scale_count = scale_count + 1;
			if (scale_count == 33) {
				//console.log("Read all the scale params");

				// Extract data into an array

				var arr_data = [];

				fs.readFileSync(data_path).toString().split("\n").forEach(function (data_line) {
					//console.log("Reading data :" + data_line)
					arr_data.push(data_line);
					data_count = data_count + 1;
					if (data_count == 32 * node_points + 1) {
						//console.log("Read all the data");

						var result_data = [];

						// parse the data array to get relevant results
						for (var i = 1; i <= node_points; i++) {
							result_data.push({
								timeVal: i * time / node_points,
								tempVal: arr_scale[index_temp] * arr_data[i + node_points * (index_temp) - 1],
								fadeVal: -1 * arr_scale[index_fade] * arr_data[i + node_points * (index_fade) - 1],
								voltageVal: arr_scale[index_voltage] * arr_data[i + node_points * (index_voltage) - 1],
								currentVal: arr_scale[index_current] * arr_data[i + node_points * (index_current) - 1],
								socVal: ((100 * arr_scale[index_soc] * arr_data[i + node_points * (index_soc) - 1]) / 30555 - 0.259) / (0.99 - 0.259)    // soc calculation is subjective to battery parameters
							});
						}

						var result = {
							result_data : result_data,
							charge_stored : chargeStored
						};

						// send the data to the client
						res.status(200).json(result);

						var result1 = new Result({
							username: username.username,
							name: name,
							current: current,
							time: time,
							data: result_data
						});

						result1.save(function (err) {
							if (err) {
								console.log("Error in saving to database");
								//return handleError(err);
							}
						});

						// Reset the bounds file with original open bounds
						arr_bound = []; bound_count = 1;
						fs.readFileSync(bounds_path).toString().split("\n").forEach(function (bound_line) {
							//console.log("Reading bounds file" + bound_line);
							if (bound_count == 14) {
								fade_limits = bound_line.split(/\b(\s)/);
								//console.log("Fade_limits" + fade_limits);
								fade_line = -1e1 + "\t" + fade_limits[2] + "\r";
								arr_bound.push(fade_line);
							}
							else if (bound_count == 32) {

								var bound_writeText = arr_bound.join("\n");

								try {
									fs.writeFileSync(bounds_path, bound_writeText);
								}
								catch (er) {
									console.log("Error in writing to the bounds file");
									process.exit(1);
								}
							}
							else {
								arr_bound.push(bound_line);
							}
							bound_count = bound_count + 1;
						});
					}




				});
			}
		});
	}

	// TODO: Handle connection timeouts and other reasons that can cause server crash
	optimalchargeSimulation(current, time, name);
});

router.get('/logout', function (req, res) {
	req.logout();
	res.status(200).json({
		status: 'Bye!'
	});
});

router.get('/status', function (req, res) {
	if (!req.isAuthenticated()) {
		return res.status(200).json({
			status: false
		});
	}
	res.status(200).json({
		status: true
	});
});

module.exports = router;
