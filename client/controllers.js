angular.module('myApp').controller('loginController',
  ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {

        $scope.login = function () {

            // initial values
            $scope.error = false;
            $scope.disabled = true;

            // call login from service
            AuthService.login($scope.loginForm.username, $scope.loginForm.password)
        // handle success
        .then(function () {
                $location.path('/');
                $scope.disabled = false;
                $scope.loginForm = {};
            })
        // handle error
        .catch(function () {
                $scope.error = true;
                $scope.errorMessage = "Invalid username and/or password";
                $scope.disabled = false;
                $scope.loginForm = {};
            });

        };

    }]);

angular.module('myApp').controller('logoutController',
  ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {

        $scope.logout = function () {

            // call logout from service
            AuthService.logout()
        .then(function () {
                $location.path('/login');
            });

        };

    }]);

angular.module('myApp').controller('registerController',
  ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {

        $scope.register = function () {

            // initial values
            $scope.error = false;
            $scope.disabled = true;

            // call register from service
            AuthService.register($scope.registerForm.username, $scope.registerForm.password)
        // handle success
        .then(function () {
                $location.path('/login');
                $scope.disabled = false;
                $scope.registerForm = {};
            })
        // handle error
        .catch(function () {
                $scope.error = true;
                $scope.errorMessage = "Something went wrong!";
                $scope.disabled = false;
                $scope.registerForm = {};
            });

        };

    }]);


// Controller to take care of sending the simulation data and sending it to the server
angular.module('myApp').controller('homeController',
  ['$scope', '$location', '$q', '$http', 'AuthService',
    function ($scope, $location, $q, $http, AuthService) {
        $scope.resultStatus = '';
        $scope.pageHeader = 'Charging Panel';
        $scope.supportingTextHeader = 'Enter values and click button charge to simulate charging';
        $scope.showCurrent = false;
        $scope.showTime = false;
        $scope.showCycle = false;
        $scope.showFormButtons = false;
        $scope.simulation = "";
        $scope.simulation.current = "";
        $scope.simulation.time = "";
        $scope.showGraph = false;
        $scope.showGraphButtons = false;
        $scope.showResultStatus = false;
        $scope.showGraphCard = false;
        $scope.showPlot = false;

        // Dynamically update the ng-click of the button
        $scope.buttons = [{ "method" : "charge", "title" : "Charge" },
            { "method" : "discharge", "title" : "Discharge" },
            { "method" : "cycle", "title" : "Cycle" }];
        $scope.actionText = "Charge";
        $scope.btn = $scope.buttons[0];
        $scope.graphData = [];



        $scope.chargeView = function () {
            $scope.pageHeader = 'Charging Panel';
            $scope.showCurrent = true;
            $scope.showTime = true;
            $scope.showCycle = false;
            $scope.showFormButtons = true;
            $scope.actionText = "Charge";
            $scope.btn = $scope.buttons[0];
            $scope.showGraph = false;
            $scope.showGraphCard = false;
            $scope.showPlot = false;
        };

        $scope.dischargeView = function () {
            $scope.pageHeader = 'Discharging Panel';
            $scope.showCurrent = true;
            $scope.showTime = false;
            $scope.showCycle = false;
            $scope.showFormButtons = true;
            $scope.actionText = "Discharge";
            $scope.btn = $scope.buttons[1];
            $scope.showGraph = false;
            $scope.showGraphCard = false;

        };

        $scope.cycleView = function () {
            $scope.pageHeader = 'Coming Soon';
            $scope.showCurrent = false;
            $scope.showTime = false;
            $scope.showCycle = false;
            $scope.showFormButtons = false;
            $scope.actionText = "Cycle";
            $scope.showGraph = false;
            $scope.showGraphCard = false;
        };

        $scope.parametersView = function () {
            $scope.pageHeader = 'Coming Soon';
            $scope.showCurrent = false;
            $scope.showTime = false;
            $scope.showCycle = false;
            $scope.showFormButtons = false;
            $scope.showGraph = false;
            $scope.showGraphCard = false;
        };


        $scope.charge = function (simulation) {
            // send the charge current and charge time to the server and call appropriate function
            // alert("Charging");
            // create a new instance of deferred
            $scope.showGraph = false;
            $scope.resultStatus = '';
            $scope.showGraphButtons = false;
            $scope.showGraphCard = false;
            $scope.graphData = [];
            $scope.showPlot = false;


            var deferred = $q.defer();

            // send a post request to the server
            $http.post('/user/chargeSolution',
                { current: simulation.current, time: simulation.time })
                // handle success
                .success(function (data, status) {
                if (status === 200) {
                    $scope.showGraphCard = true;
                    $scope.showResultStatus = true;
                    $scope.resultStatus = "Model Solved! Choose Plot";
                    //console.log(data.toString());
                    $scope.showGraphButtons = true;
                    $scope.graphData = [];
                    $scope.showPlot = false;

                    $scope.options = { showLink: false, displayLogo: false };
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

                    //$scope.colors = ['#45b7cd', '#ff6384', '#ff8e72'];

                    data.forEach(function (stepData) {
                       /* timeValues.push(stepData.timeVal);
                        tempValues.push(stepData.tempVal);
                        voltageValues.push(stepData.voltageVal);
                        currentValues.push(stepData.currentVal);
                        fadeValues.push(stepData.fadeVal);
                        socValues.push(stepData.socVal);*/
                        voltageData.push({x : stepData.timeVal, y : stepData.voltageVal});
                        currentData.push({x : stepData.timeVal, y : stepData.currentVal});
                        fadeData.push({x : stepData.timeVal, y : stepData.fadeVal});
                        socData.push({x : stepData.timeVal, y : stepData.socVal});
                        temperatureData.push({x : stepData.timeVal, y : stepData.tempVal});

                    });

                    $scope.plotVoltage = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.showPlot = true;

                        $scope.data = [voltageData];

                        $scope.options = {

                        };
                    };

                    $scope.plotCurrent = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.showPlot = true;


                        $scope.data = [currentData];

                        $scope.options = {
                            scales: {
                                xAxes: [{
                                    type: 'linear',
                                    position: 'bottom',
                                    scaleLabel :{
                                        display :true,
                                        labelString : "Time (sec)"
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel :{
                                        display :true,
                                        labelString : "Current (A)"
                                    }
                                }]
                            },
                            title: {
                                display: true,
                                text: 'Current'
                            }
                        };
                    };

                    $scope.plotFade = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.showPlot = true;
                        $scope.data = [fadeData];

                        $scope.options = {
                            scales: {
                                xAxes: [{
                                    type: 'linear',
                                    position: 'bottom',
                                    scaleLabel :{
                                        display :true,
                                        labelString : "Time (sec)"
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel :{
                                        display :true,
                                        labelString : "Fade (Ah)"
                                    }
                                }]
                            },
                            title: {
                                display: true,
                                text: 'Fade'
                            }
                        };
                    };

                    $scope.plotTemperature = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.showPlot = true;
                        $scope.data = [temperatureData];

                        $scope.options = {
                            scales: {
                                xAxes: [{
                                    type: 'linear',
                                    position: 'bottom',
                                    scaleLabel :{
                                        display :true,
                                        labelString : "Time (sec)"
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel :{
                                        display :true,
                                        labelString : "Temperature (K)"
                                    }
                                }]
                            },
                            title: {
                                display: true,
                                text: 'Temperature'
                            }
                        };
                    };

                    $scope.plotSoC = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.showPlot = true;
                        $scope.data = [socData];

                        $scope.options = {
                            scales: {
                                xAxes: [{
                                    type: 'linear',
                                    position: 'bottom',
                                    scaleLabel :{
                                        display :true,
                                        labelString : "Time (sec)"
                                    }
                                }],
                                yAxes: [{
                                    scaleLabel :{
                                        display :true,
                                        labelString : "SoC (%)"
                                    }
                                }]
                            },
                            title: {
                                display: true,
                                text: 'SoC'
                            }
                        };
                    };

                    user = true;

                    function plotV() {
                        var ctV = document.getElementById("plot-voltage");
                        var voltageChart = new Chart(ctV, {
                            type: 'line',
                            data: {
                                datasets: [{
                                    label: 'Voltage',
                                    data: voltageData
                                }]
                            },
                            options: {
                                scales: {
                                    xAxes: [{
                                        type: 'linear',
                                        position: 'bottom',
                                        scaleLabel :{
                                            display :true,
                                            labelString : "Time (sec)"
                                        }
                                    }],
                                    yAxes: [{
                                        scaleLabel :{
                                            display :true,
                                            labelString : "Voltage (V)"
                                        }
                                    }]
                                },
                                title: {
                                    display: true,
                                    text: 'Voltage'
                                }
                            }
                        });
                    }

                    function plotI() {
                        var ctI = document.getElementById("plot-current");
                        var currentChart = new Chart(ctI, {
                            type: 'line',
                            data: {
                                datasets: [{
                                    label: 'Current',
                                    data: currentData
                                }]
                            },
                            options: {
                                scales: {
                                    xAxes: [{
                                        type: 'linear',
                                        position: 'bottom',
                                        scaleLabel :{
                                            display :true,
                                            labelString : "Time (sec)"
                                        }
                                    }],
                                    yAxes: [{
                                        scaleLabel :{
                                            display :true,
                                            labelString : "Current (A)"
                                        }
                                    }]
                                },
                                title: {
                                    display: true,
                                    text: 'Current'
                                }
                            }
                        });
                    }

                    plotV()
                    plotI()
                    deferred.resolve();
                } else {
                    user = false;
                    deferred.reject();
                }
            })
            // handle error
            .error(function (data) {
                user = false;
                deferred.reject();
            });

            // return promise object
            return deferred.promise;
        };

        $scope.discharge = function (simulation) {
            // send the discharge current and discharge time to the server and call appropriate function

            // create a new instance of deferred
            var deferred = $q.defer();

            // send a post request to the server
            $http.post('/user/dischargeSolution',
                { current: simulation.current })
                // handle success
                .success(function (data, status) {
                if (status === 200 && data.status) {
                    user = true;
                    deferred.resolve();
                } else {
                    user = false;
                    deferred.reject();
                }
            })
                // handle error
                .error(function (data) {
                user = false;
                deferred.reject();
            });

            // return promise object
            return deferred.promise;
        }
    }]);
