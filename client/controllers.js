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
                    console.log(data.toString());
                    $scope.showGraphButtons = true;
                    $scope.graphData = [];
                    $scope.showPlot = false;

                    $scope.options = { showLink: false, displayLogo: false };
                    var timeValues = [];
                    var tempValues = [];
                    var voltageValues = [];
                    var currentValues = [];
                    var fadeValues = [];
                    var socValues = [];

                    data.forEach(function (stepData) {
                        timeValues.push(stepData.timeVal);
                        tempValues.push(stepData.tempVal);
                        voltageValues.push(stepData.voltageVal);
                        currentValues.push(stepData.currentVal);
                        fadeValues.push(stepData.fadeVal);
                        socValues.push(stepData.socVal);
                    });

                    $scope.plotVoltage = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.showPlot = true;
                        $scope.layout = {
                          height: 500,
                          width: 500,
                          title: 'Voltage',
                          xaxis: {
                              title: 'Time (sec)'
                            },
                            yaxis: {
                                title: 'Voltage (V)'
                            },
                            plot_bgcolor: "rgb(229,229,229)",
                            margin: {
                                autoexpand: false,
                                l: 100,
                                r: 20,
                                t: 50
                            }

                        };
                        $scope.graphData = [{
                                x : timeValues,
                                y : voltageValues
                            }];
                    };

                    $scope.plotCurrent = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.layout = { height: 500, width: 500, title: 'Current',
                        xaxis: {
                            title: 'Time (sec)'
                          },
                          yaxis: {
                              title: 'Current (A)'

                          },
                          plot_bgcolor: "rgb(229,229,229)",
                          margin: {
                            autoexpand: false,
                              l: 100,
                              r: 20,
                              t: 50
                            }
                        };
                        $scope.graphData = [{
                                x : timeValues,
                                y : currentValues
                            }];
                    };

                    $scope.plotFade = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.layout = { height: 500, width: 500, title: 'Fade',
                        xaxis: {
                            title: 'Time (sec)'
                          },
                          yaxis: {
                              title: 'Fade (Ah)'
                          },
                          plot_bgcolor: "rgb(229,229,229)",

                          margin: {
                            autoexpand: false,
                              l: 100,
                              r: 20,
                              t: 50
                        }
                        };
                        $scope.graphData = [{
                                x : timeValues,
                                y : fadeValues
                            }];
                    };

                    $scope.plotTemperature = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.layout = { height: 500, width: 500, title: 'Temperature',
                        xaxis: {
                            title: 'Time (sec)'
                          },
                          yaxis: {
                              title: 'Temperature (K)'
                          },
                          plot_bgcolor: "rgb(229,229,229)",
                          margin: {
                            autoexpand: false,
                              l: 100,
                              r: 20,
                              t: 50
                        }
                        };

                        $scope.graphData = [{
                                x : timeValues,
                                y : tempValues
                            }];
                    };

                    $scope.plotSoC = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.layout = { height: 500, width: 500, title: 'SoC',
                        xaxis: {
                            title: 'Time (sec)'
                          },
                          yaxis: {
                              title: 'SoC (%)'
                          },
                          plot_bgcolor: "rgb(229,229,229)",
                          margin: {
                            autoexpand: false,
                              l: 100,
                              r: 20,
                              t: 50
                        }
                        };
                        $scope.graphData = [{
                                x : timeValues,
                                y : socValues
                            }];
                    };

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
