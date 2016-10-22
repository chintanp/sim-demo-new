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

router.post('/register', function(req, res) {
  User.register(new User({ username: req.body.username }),
    req.body.password, function(err, account) {
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

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }
      res.status(200).json({
        status: 'Login successful!'
      });
    });
  })(req, res, next);
});

// Perform action upon call to charge
router.post('/chargeSolution', function (req, res) {
    console.log("Got from browser for charging - " + "current: " + req.body.current + "time : " + req.body.time);

    //  Pass the current and time values to the exe and perform charge
    var current = req.body.current || 1;
    var time = req.body.time || 1800;

    var chargeSimulation = function (current, time) {
        console.log("Starting exe");
        console.log(__dirname);
        var cmd = 'D:/CP/BII/simulation-demo/sim-demo-new/server/Ipopt-exe-demo/Eg-C.exe';
        var cwd = 'D:/CP/BII/simulation-demo/sim-demo-new/server/Ipopt-exe-demo';
        var final_time_path = 'D:/CP/BII/simulation-demo/sim-demo-new/server/Ipopt-exe-demo/final_time.txt';
        var bounds_path = 'D:/CP/BII/simulation-demo/sim-demo-new/server/Ipopt-exe-demo/bounds.txt';
        var scaleparam_path = 'D:/CP/BII/simulation-demo/sim-demo-new/server/Ipopt-exe-demo/scaleparam.txt';
        var data_path = 'D:/CP/BII/simulation-demo/sim-demo-new/server/Ipopt-exe-demo/data.txt';

        // Updating the boudns file
        var bound_instream = fs.createReadStream(bounds_path);
        var bound_outstream = new stream;
        var rl_bound = readline.createInterface(bound_instream, bound_outstream);
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
        var node_points = 70; // predecided in maple

        /*rl_bound.on('line', function (bound_line) {
            // process line here
            arr_bound.push(bound_line);
            bound_count = bound_count + 1;
            if (bound_count == 32) {
                arr_bound.push(bound_writeString);
                var bound_writeText = arr_bound.join("\n");

                fs.writeFile(bounds_path, bound_writeText, function (err) {
                    if (err) return console.log(err);
                });

                rl_bound.close();
            }
        });
*/
        fs.readFileSync(bounds_path).toString().split("\n").forEach(function (bound_line) {
		      //console.log("Reading bounds file" + line);
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


        // Perform the simulation
        //execFile("dir");
        // execFile(cmd, { cwd : cwd }, function (error, stdout, stderr) {
        //     if (error) {
        //         console.log("Error running the exe" + error);
        //         throw error;
        //     }
        //     console.log(stdout);
        try {
        var output1 = execFileSync(cmd, {cwd : cwd}).toString();
        //  var output2 = execFileSync(cmd, {cwd : cwd}).toString();
        console.log("output of the simulation -------------------------------" + "\n\n" + output1);
        //  console.log("output of the simulation -------------------------------" + "\n\n" + output1);
      }

      catch (er) {
        console.log("There was an error " + er.file + er.pid + er.status);
        process.exit(1);
      }
            // Extract results

        // Extract scaleparams into an array
        /*var scale_instream = fs.createReadStream(scaleparam_path);
        var scale_outstream = new stream;
        var rl_scale = readline.createInterface(scale_instream, scale_outstream);*/
        var arr_scale = [];

	    fs.readFileSync(scaleparam_path).toString().split("\n").forEach(function (scale_line) {
            console.log("Reading scaleparams :" +  scale_line);
            arr_scale.push(scale_line);
            scale_count = scale_count + 1;
            if (scale_count == 33) {
                console.log("Read all the scale params");

                // Extract data into an array
                /*var data_instream = fs.createReadStream(data_path);
                var data_outstream = new stream;
                var rl_data = readline.createInterface(data_instream, data_outstream);*/
                var arr_data = [];

	            fs.readFileSync(data_path).toString().split("\n").forEach(function (data_line) {
                    console.log("Reading data :" + data_line)
                    arr_data.push(data_line);
                    data_count = data_count + 1;
                    if (data_count == 32 * node_points + 1) {
                        console.log("Read all the data");

                        var result_data = [];

                        // parse the data array to get relevant results
                        for (var i = 1; i <= 70; i++) {
                            result_data.push({
                                timeVal : i * time / node_points,
                                tempVal : arr_scale[index_temp] * arr_data[i + node_points * (index_temp) - 1],
                                fadeVal : -1 * arr_scale[index_fade] * arr_data[i + node_points * (index_fade) - 1],
                                voltageVal : arr_scale[index_voltage] * arr_data[i + node_points * (index_voltage) - 1],
                                currentVal : arr_scale[index_current] * arr_data[i + node_points * (index_current) - 1],
                                socVal : ((100 * arr_scale[index_soc] * arr_data[i + node_points * (index_soc) - 1]) / 30555 - 0.259)/(0.99 - 0.259)    // soc calculation is subjective to battery parameters
                            });
                        }

                        // send the data to the client
                        res.status(200).json(result_data);

                        }
                    });
                }
            });
          }

    chargeSimulation(current, time);
});

// Perform action upon call to discharge
router.post('/dischargeSolution', function (req, res) {
    console.log("Got from browser for discharging - " + "current: " + req.body.current );

    //  Pass the current and time values to the exe and perform discharge
});

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});

router.get('/status', function(req, res) {
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
