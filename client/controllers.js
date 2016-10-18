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
        $scope.pageHeader = 'Select action';
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
        // Dynamically update the ng-click of the button
        $scope.buttons = [{ "method" : "charge", "title" : "Charge" }, 
            { "method" : "discharge", "title" : "Discharge" }, 
            { "method" : "cycle", "title" : "Cycle" }];
        
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

        };
        
        $scope.cycleView = function () {
            $scope.pageHeader = 'Coming Soon';
            $scope.showCurrent = false;
            $scope.showTime = false;
            $scope.showCycle = false;
            $scope.showFormButtons = false;
            $scope.actionText = "Cycle";
            $scope.showGraph = false;

        };
        
        $scope.parametersView = function () {
            $scope.pageHeader = 'Coming Soon';
            $scope.showCurrent = false;
            $scope.showTime = false;
            $scope.showCycle = false;
            $scope.showFormButtons = false;
            $scope.showGraph = false;
        };
        
        
        $scope.charge = function (simulation) {
            // send the charge current and charge time to the server and call appropriate function
            // alert("Charging");
            // create a new instance of deferred
            var deferred = $q.defer();
            
            // send a post request to the server
            $http.post('/user/chargeSolution',
                { current: simulation.current, time: simulation.time })
                // handle success
                .success(function (data, status) {
                if (status === 200) {
                    $scope.showResultStatus = true;
                    $scope.resultStatus = "Model Solved! Choose Plot";
                    console.log(data.toString());
                    $scope.showGraphButtons = true;
                    
                    $scope.options = { showLink: false, displayLogo: false };
                    var timeValues = [];
                    var tempValues = [];
                    var voltageValues = [];
                    var currentValues = [];
                    var fadeValues = [];

                    data.forEach(function (stepData) {
                        timeValues.push(stepData.timeVal);
                        tempValues.push(stepData.tempVal);
                        voltageValues.push(stepData.voltageVal);
                        currentValues.push(stepData.currentVal);
                        fadeValues.push(stepData.fadeVal);
                    });

                    $scope.plotVoltage = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.layout = { height: 500, width: 500, title: 'Voltage' };
                        $scope.graphData = [{
                                x : timeValues, 
                                y : voltageValues
                            }];
                    };

                    $scope.plotCurrent = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.layout = { height: 500, width: 500, title: 'Current' };
                        $scope.graphData = [{
                                x : timeValues, 
                                y : currentValues
                            }];
                    };
                    
                    $scope.plotFade = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.layout = { height: 500, width: 500, title: 'Fade' };
                        $scope.graphData = [{
                                x : timeValues, 
                                y : fadeValues
                            }];
                    };
                    
                    $scope.plotTemperature = function () {
                        $scope.showResultStatus = true;
                        $scope.showGraph = true;
                        $scope.layout = { height: 500, width: 500, title: 'Temperature' };
                        $scope.graphData = [{
                                x : timeValues, 
                                y : temperatureValues
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