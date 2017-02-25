angular.module('myApp').controller('loginController', ['$scope', '$location', 'AuthService',
    function($scope, $location, AuthService) {

        $scope.login = function() {

            // initial values
            $scope.error = false;
            $scope.disabled = true;

            // call login from service
            AuthService.login($scope.loginForm.username, $scope.loginForm.password)
                // handle success
                .then(function() {
                    $location.path('/');
                    $scope.disabled = false;
                    $scope.loginForm = {};
                })
                // handle error
                .catch(function() {
                    $scope.error = true;
                    $scope.errorMessage = "Invalid username and/or password";
                    $scope.disabled = false;
                    $scope.loginForm = {};
                });

        };

    }
]);

angular.module('myApp').controller('logoutController', ['$scope', '$location', 'AuthService',
    function($scope, $location, AuthService) {

        $scope.logout = function() {

            // call logout from service
            AuthService.logout()
                .then(function() {
                    $location.path('/login');
                });

        };

    }
]);

angular.module('myApp').controller('registerController', ['$scope', '$location', 'AuthService',
    function($scope, $location, AuthService) {

        $scope.register = function() {

            // initial values
            $scope.error = false;
            $scope.disabled = true;

            // call register from service
            AuthService.register($scope.registerForm.username, $scope.registerForm.password)
                // handle success
                .then(function() {
                    $location.path('/login');
                    $scope.disabled = false;
                    $scope.registerForm = {};
                })
                // handle error
                .catch(function() {
                    $scope.error = true;
                    $scope.errorMessage = "Something went wrong!";
                    $scope.disabled = false;
                    $scope.registerForm = {};
                });

        };

    }
]);

// Controller to take care of sending the simulation data and sending it to the server
angular.module('myApp').controller('homeController', ['$scope', '$location',
    '$q', '$http', '$document', '$anchorScroll','AuthService',
    function($scope, $location, $q, $http, $document, $anchorScroll, AuthService) {
        $scope.resultStatus = '';
        $scope.pageHeader = 'Charging Panel';
        $scope.logo = './dist/img/bii-logo.png'
        $scope.supportingTextHeader = 'Enter current and time to run simulation for base case';
        $scope.showCurrent = false;
        $scope.showTime = false;
        $scope.showCycle = false;
        $scope.showFormButtons = false;
        $scope.simulation = "";
        $scope.simulation.current = 2;
        $scope.simulation.time = 1800;
        $scope.simulation.name = $scope.simulation.current +
                                    'C' + $scope.simulation.time;
        $scope.showGraph = false;
        $scope.showGraphButtons = false;
        $scope.showResultStatus = false;
        $scope.showGraphCard = false;
        $scope.showPlot = false;
        $scope.showOptimal = false;
        $scope.disableOptimal = true;

        $scope.voltage_data = [];
        $scope.current_data = [];
        $scope.capacityLoss = [];
        $scope.remainingLife = [];

        var timeValues = [];
        var tempValues = [];
        var voltageValues = [];
        var currentValues = [];
        $scope.data = [];
        var fadeValues = [];
        var socValues = [];
        var voltageData = [];
        var currentData = [];
        var socData = [];
        var fadeData = [];
        var temperatureData = [];

        $scope.graphData = [];

        $scope.baseCharge = function(simulation) {

            var deferred = $q.defer();

	        $scope.showGraphCard = false;
	        $scope.showResultStatus = false;
	        $scope.resultStatus = "";
	        $scope.showCharts = false;
	        $scope.graphData = [];
	        $scope.showPlot = false;
	        $scope.showOptimal = false;
	        $scope.voltage_data = [];
	        $scope.current_data = [];

            // send a post request to the server
            $http.post('/user/baseCharge', {
                    current: simulation.current,
                    time: simulation.time,
                    name: simulation.name
                })
                // handle success
                .success(function(result, status) {
                    if (status === 200) {
                       // If success, i.e. model solved, then show graph
                        $scope.showGraphCard = true;
                        $scope.showResultStatus = true;
                        $scope.resultStatus = "Plotting Base Case";
                        $scope.showCharts = true;
                        $scope.graphData = [];
                        $scope.showPlot = false;
                        $scope.disableOptimal = false;


                        voltageData = [];
                        currentData = [];
                        socData = [];
                        fadeData = [];
                        temperatureData = [];

                        var raw_data = result.result_data;
                        $scope.basechargeStored = result.charge_stored;

                        // Scroll to the graph card
                        //$location.hash('graphCard');
                        //$anchorScroll();

                        $scope.options = {
                            showLink: false,
                            displayLogo: false
                        };
                        // Parse 'data' recd from server to get voltage, current etc.
                        raw_data.forEach(function(stepData) {

                            voltageData.push({
                                x: stepData.timeVal,
                                y: stepData.voltageVal
                            });
                            currentData.push({
                                x: stepData.timeVal,
                                y: stepData.currentVal
                            });
                            fadeData.push({
                                x: stepData.timeVal,
                                y: stepData.fadeVal
                            });
                            socData.push({
                                x: stepData.timeVal,
                                y: stepData.socVal
                            });
                            temperatureData.push({
                                x: stepData.timeVal,
                                y: stepData.tempVal
                            });

                        });

                        // Plotting code here
                        $scope.voltage_options = {
                            scales: {
                                xAxes: [{
                                    type: 'linear',
                                    position: 'bottom',
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Time (sec)"
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Voltage (V)"
                                    }
                                }]
                            },
                            title: {
                                display: true,
                                text: 'Voltage'
                            },
                            scaleShowGridLines: false
                        };

                        $scope.current_options = {
                            scales: {
                                xAxes: [{
                                    type: 'linear',
                                    position: 'bottom',
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Time (sec)"
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Current (A)"
                                    }
                                }]
                            },
                            title: {
                                display: true,
                                text: 'Current'
                            }
                        };

                        // Add elements to the plotting dataset arrays, this adds lines to graphs
                        $scope.voltage_data.push(voltageData);
                        $scope.current_data.push(currentData);

                        user = true;

                        deferred.resolve();
                    }
                    else {
                        user = false;
                        deferred.reject();
                    }
                })
                // handle error
                .error(function(data) {
                    user = false;
                    deferred.reject();
                });

            // return promise object
            return deferred.promise;
        };

        $scope.optimalCharge = function(simulation) {

            var deferred = $q.defer();

            // send a post request to the server
            $http.post('/user/optimalCharge', {
                    current: simulation.current,
                    time: simulation.time,
                    name: simulation.name
                })
                // handle success
                .success(function(result, status) {
                    if (status === 200) {
                       // If success, i.e. model solved, then show graph
                        $scope.showGraphCard = true;
                        $scope.showResultStatus = true;
                        $scope.resultStatus = "Plotting Base Case and Optimal Case";
                        $scope.showCharts = true;
                        $scope.showOptimal = true;
                        $scope.graphData = [];
                        $scope.showPlot = false;

                        voltageData = [];
                        currentData = [];
                        socData = [];
                        fadeData = [];
                        temperatureData = [];

	                    var raw_data = result.result_data;
	                    $scope.optimalchargeStored = result.charge_stored;

                        // Scroll to the graph card
                        // $location.hash('graphCard');
                        // $anchorScroll();

                        $scope.options = {
                            showLink: false,
                            displayLogo: false
                        };
                        // Parse 'data' recd from server to get voltage, current etc.
                        raw_data.forEach(function(stepData) {

                            voltageData.push({
                                x: stepData.timeVal,
                                y: stepData.voltageVal
                            });
                            currentData.push({
                                x: stepData.timeVal,
                                y: stepData.currentVal
                            });
                            fadeData.push({
                                x: stepData.timeVal,
                                y: stepData.fadeVal
                            });
                            socData.push({
                                x: stepData.timeVal,
                                y: stepData.socVal
                            });
                            temperatureData.push({
                                x: stepData.timeVal,
                                y: stepData.tempVal
                            });

                        });

                        // Plotting code here
                        $scope.voltage_options = {
                            scales: {
                                xAxes: [{
                                    type: 'linear',
                                    position: 'bottom',
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Time (sec)"
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Voltage (V)"
                                    }
                                }]
                            },
                            title: {
                                display: true,
                                text: 'Voltage'
                            },
                            scaleShowGridLines: false
                        };

                        $scope.current_options = {
                            scales: {
                                xAxes: [{
                                    type: 'linear',
                                    position: 'bottom',
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Time (sec)"
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel: {
                                        display: true,
                                        labelString: "Current (A)"
                                    }
                                }]
                            },
                            title: {
                                display: true,
                                text: 'Current'
                            }
                        };

                        // Add elements to the plotting dataset arrays, this adds lines to graphs
                        $scope.voltage_data.push(voltageData);
                        $scope.current_data.push(currentData);

                        $scope.remainingLife = (($scope.optimalchargeStored - $scope.basechargeStored)*100/18.1).toFixed(2);
                        $scope.mobileHours = (($scope.optimalchargeStored - $scope.basechargeStored)*12/2).toFixed(2);
                        $scope.extraMiles = (($scope.optimalchargeStored - $scope.basechargeStored)*375*295/(100*1000)).toFixed(2);
                        $scope.extraCents = (($scope.optimalchargeStored - $scope.basechargeStored)*375*295/(100*1000)).toFixed(2);
	                    user = true;

                        deferred.resolve();
                    }
                    else {
                        user = false;
                        deferred.reject();
                    }
                })
                // handle error
                .error(function(data) {
                    user = false;
                    deferred.reject();
                });

            // return promise object
            return deferred.promise;
        }

        // Clear all the graphs and area
        $scope.resetGraph = function() {
            $scope.resultStatus = "";
            $scope.showCharts = false;
            $scope.graphData = [];
            $scope.showPlot = false;
            $scope.showGraphCard = false;
            $scope.voltage_data = [];
            $scope.current_data = [];

        }
    }
]);
