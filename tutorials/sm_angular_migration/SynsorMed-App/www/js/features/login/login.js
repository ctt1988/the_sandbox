var secretEmptyKey = '[$empty$]'

angular.module('synsormed.controllers.login', [
    'synsormed.services.authentication',
    'synsormed.services.user',
    'synsormed.services.oauth',
    'synsormed.services.pushNotification',
    'synsormed.services.touchId',
    'synsormed.services.isLoggedin'
])
    .controller('loginViewController', [
        '$http',
        'synsormed.services.authentication.Login',
        '$scope',
        '$location',
        '$interval',
        'synsormed.services.user.UserService',
        'synsormed.services.video.Connector',
        'synsormed.services.logging.time',
        '$modal',
        'media',
        'synsormed.services.pushNotification.pushNotificationService',
        'localStorageService',
        'synsormed.factory.user.loggedin',
        function ($http, LoginService, $scope, $location, $interval, UserService, videoConnector, TimeLogger, $modal, Media, pushNotificationService, localStorageService, LoggedInUser) {

            UserService.clearUser();
            UserService.clearUserData();
            pushNotificationService.init();

            $scope.initVideo = function () {
                if (!window.videoPlugin) {
                    console.error("!!!!!!!!! Video SERVICE NOT ACTIVE !!!!!!!!!");
                }
                videoConnector.initVideoSystem();
                console.log("Clicked init button");
                $scope.status = "Clicked";
            }

            TimeLogger.log("LoginScreen");
            try {
                videoConnector.removeCall();
            } catch (e) {/* ignore */ }
            videoConnector.disconnect(true);

            $location.path('/login/patient'); //if not to test the bandwidth then redirect to login/patient
            //if(!$scope.hasHighBandwidth) $location.path('/network');

            $scope.year = new Date().getFullYear();

            $scope.showTutorial = function () {
                var modalInstance = $modal.open({
                    windowClass: 'howItWorksModal',
                    templateUrl: 'js/features/login/howItWorks.html',
                    controller: 'howItWorksController'
                });
            };

            if (localStorageService.get('user-loggedin') && localStorageService.get('saveUser')) {
                //localStorageService.set('synsormed:patient:code',localStorageService.get('user-loggedin').loggedUser.code);
                //$scope.rememberMe = !!localStorageService.get('synsormed:patient:code');
                $scope.rememberMe = localStorageService.get('saveUser');
                if (localStorageService.get('synsormed:patient:code')) {
                    LoggedInUser.attemptLogin(localStorageService.get('synsormed:patient:code'), $scope.rememberMe, $scope)
                        .catch(function (err) {
                            $scope.$emit('wait:stop');
                            if (err.code != 401) {
                                $scope.$emit('service:error', err);
                            } else {
                                $scope.$emit('notification:error', "An invalid code was entered");
                            }
                        });
                }

            }
            else if (localStorageService.get('logginProvider') && localStorageService.get('saveProvider')) {
                localStorageService.set('savedUsername', localStorageService.get('logginProvider').loggedUser.email);
                LoggedInUser.startAuth(localStorageService.get('savedUsername'), localStorageService.get('savedPassword'), $scope)
                    .catch(function (err) {
                        if (err.code != 401) {
                            $scope.$emit('service:error', err);
                        } else {
                            $scope.$emit('notification:error', 'Username/password combination not found.');
                        }
                    });
            }
            else {
                console.log('session out')
            }

            $scope.showLogin = function (which) {
                $location.path('/login/' + which);
            };

            $scope.showAbout = function () { //about page
                var modalInstance = $modal.open({
                    windowClass: 'aboutModal',
                    templateUrl: 'js/features/login/about.html',
                    controller: 'aboutModalController'
                });
            };
        }
    ])
    .controller('patientLoginViewController', [
        '$rootScope',
        '$scope',
        'synsormed.services.authentication.Login',
        '$location',
        '$modal',
        'synsormed.services.oauth.OauthDataManagementService',
        'localStorageService',
        'synsormed.services.pushNotification.pushNotificationService',
        'synsormed.services.touchId.TouchIdService',
        'synsormed.services.touchId.TouchIdStorage',
        'synsormed.factory.user.loggedin',
        '$timeout',
        function ($rootScope, $scope, LoginService, $location, $modal, OauthDataManagementService, localStorageService, pushNotificationService, TouchIdService, TouchIdStorage, LoggedInUser, $timeout) {

            $scope.loggedInCodes = localStorageService.get('authenticatedCodes');
            $scope.code = localStorageService.get('synsormed:patient:code'); //if there is code in the memory get it
            //$scope.rememberMe = !!localStorageService.get('synsormed:patient:code');

            if ($rootScope.gfImp) {
                var gfDataTypes = $rootScope.gfDataTypes = [
                    'steps', 'distance', 'activity'
                ];
            }

            $scope.stateComparator = function (state, viewValue) {
                return viewValue === secretEmptyKey || ('' + state).toLowerCase().indexOf(('' + viewValue).toLowerCase()) > -1;
            };

            $scope.onFocus = function (e) {
                $timeout(function () {
                    $(e.target).trigger('input');
                });
            };

            $scope.connectedService = false;
            $scope.canShare = OauthDataManagementService.canSendData();
            $scope.rememberMe = true;


            OauthDataManagementService //get the connected service name
                .sharingString()
                .then(function (serviceName) {
                    $scope.connectedService = serviceName;
                })
                .catch(function (err) {
                    console.log(err);
                    $scope.connectedService = false;
                });

            $scope.showAbout = function () { //about page
                var modalInstance = $modal.open({
                    windowClass: 'aboutModal',
                    templateUrl: 'js/features/login/about.html',
                    controller: 'aboutModalController'
                });
            };


            $scope.showTutorial = function () {
                var modalInstance = $modal.open({
                    windowClass: 'howItWorksModal',
                    templateUrl: 'js/features/login/howItWorks.html',
                    controller: 'howItWorksController'
                });
            };

            $scope.needHelp = function () {
                var modalInstance = $modal.open({
        			      windowClass: 'helpModal',
                    templateUrl: 'js/features/login/help.html',
                    controller: 'needHelpController'
                });
                modalInstance.result //reload the monitor list
                .then(function(codes){
                    $scope.loggedInCodes = codes;
                })
            };

            $scope.focusInput = function () {
                $('input:first').focus(); //This is a hack due to the UI
            };

            $scope.submitForm = function () {
                localStorageService.set('saveUser', $scope.rememberMe);

                $scope.$broadcast('validate');

                $scope.form.$setDirty();

                if ($scope.code && $scope.code.search(/[^a-zA-Z0-9]/) != -1) {
                    $scope.$broadcast('setInvalid:code', 'characters');
                } else {
                    $scope.$broadcast('setValid:code', 'characters');
                }

                $scope.showLoginError = false;
                if ($scope.form.$valid) {
                    if (!$scope.code) {
                        $scope.$emit('notification:error', 'Please enter your code');
                    } else {
                        LoggedInUser.attemptLogin($scope.code, $scope.rememberMe, $scope)
                        .then(function () {
                            var authenticatedCodes = localStorageService.get('authenticatedCodes') || [];
                            if (authenticatedCodes.indexOf($scope.code) == -1) {
                                authenticatedCodes.push($scope.code.toUpperCase());
                            }
                            localStorageService.set('authenticatedCodes', authenticatedCodes);
                        })
                        .catch(function (err) {
                            if (err.status == 401) {
                                $scope.$emit('notification:error', "An invalid code was entered");
                            }
                            else if (err.status == 0) {
                                $scope.$emit('notification:error', "Please check your internet connection");
                            }
                            else {
                                $scope.$emit('service:error', err);
                            }
                        });
                    }
                }
                else {
                    if ($scope.form.$error.required && $scope.form.$error.required.length > 0) { //This is more or less a hack due to the UI
                        $scope.$emit('notification:error', "Code is required");
                    }
                    if ($scope.form.$error.characters && $scope.form.$error.characters.length > 0) {
                        $scope.$emit('notification:error', "Invalid characters entered. Only A-Z and 0-9 allowed.");
                    }
                }
            }

            // START - GOOGLE FIT CODE - cordova-plugin-health
            if ($rootScope.gfImp && navigator.health) {
                navigator.health.isAvailable(
                    function (available) {
                        if (available) {
                            $rootScope.gfAvail = true;
                            navigator.health.requestAuthorization(gfDataTypes,
                                function (data) {
                                    if (data) {
                                        $rootScope.gfOauth = true;
                                    }
                                },
                                function (err) { console.log(err) });

                                navigator.health.isAuthorized(gfDataTypes,function (e) {
                                    if (e) {
                                        $rootScope.gfAuthorized = true;
                                    } else {
                                        navigator.health.requestAuthorization(gfDataTypes,
                                            function (auth) {
                                                if (auth) $rootScope.gfAuthorized = true;;
                                            },
                                            function (err) {
                                              $rootScope.gfAuthorized = true;
                                              console.log("**** the health plugin was not authorized with err: " + JSON.stringify(err));
                                            }
                                        );
                                    }
                                  },
                                  function (err) {
                                    $rootScope.gfAuthorized = true;
                                    console.log("**** the health plugin was not authorized with err: " + JSON.stringify(err));
                                  }
                               );
                        }
                    },
                    function (err) { console.log(err) }
                );
            }// END - Google Fit

            LoggedInUser.authIfTouchAvailable(true, $scope);

            $scope.showSensorPopup = function () { //show sensor data modal
                $modal.open({
                    windowClass: 'sensorModal',
                    templateUrl: 'js/features/login/sensors.html',
                    controller: 'sensorModalController'
                });
            };
        }
    ])
    .controller('providerLoginViewController', [
        '$scope',
        'synsormed.services.authentication.Login',
        '$location',
        'localStorageService',
        'synsormed.services.user.UserService',
        '$modal',
        'synsormed.services.touchId.TouchIdService',
        'synsormed.factory.user.loggedin',
        function ($scope, LoginService, $location, localStorageService, UserService, $modal, TouchIdService, LoggedInUser) {

            $scope.rememberMe = !!localStorageService.get('savedUsername');
            $scope.email = localStorageService.get('savedUsername');

            $scope.needHelp = function () {
                $modal.open({
                    windowClass: 'helpModal',
                    templateUrl: 'js/features/login/help.html',
                    controller: function ($scope, $modalInstance) {
                        $scope.close = function () {
                            $modalInstance.close();
                        }
                    }
                });
            };

            $scope.$watch('password', function () {
                $scope.showLoginError = false;
            });

            $scope.submitForm = function () {
                localStorageService.set('saveProvider', $scope.saveProvider);
                localStorageService.set('savedPassword', $scope.password);
                $scope.$broadcast('validate');
                $scope.form.$setDirty();
                $scope.showLoginError = false;
                if ($scope.form.$valid) {
                    if ($scope.saveProvider) {
                        localStorageService.set('savedUsername', $scope.email);
                    } else {
                        localStorageService.remove('savedUsername');
                    }
                    LoggedInUser.startAuth($scope.email, $scope.password, $scope)
                        .catch(function (err) {
                            if (err.code != 401) {
                                $scope.$emit('service:error', err);
                            } else {
                                $scope.$emit('notification:error', 'Username/password combination not found.');
                            }
                        });
                }
            };

            LoggedInUser.providerAuthIfTouchAvailable(true, $scope);
        }
    ])
    .controller('howItWorksController', [
        '$scope', '$modalInstance', '$timeout', 'synsormed.services.logging.time',
        function ($scope, $modalInstance, $timeout, TimeLogger) {
            TimeLogger.log("TutorialScreen");
            $scope.close = function () {
                $modalInstance.dismiss();
            }
            $timeout(function () {
                console.log($(".carousel-inner").height());
                $(".carousel-inner .image").height($(".carousel-inner").height())
            }, 100)
        }
    ])
    .controller('sensorModalController', [
        '$scope', '$modalInstance', '$location',
        function ($scope, $modalInstance, $location) {
            $scope.close = function () {
                $modalInstance.dismiss();
            };
            $scope.serviceLogin = function () { // go to services
                $modalInstance.dismiss();
                $location.path('/service/list');
            };
        }
    ])
    .controller('aboutModalController', [
        '$scope', '$modalInstance',
        function ($scope, $modalInstance) {
            $scope.year = new Date().getFullYear();
            cordova.getAppVersion(function (version) { // this will need plugin https://github.com/whiteoctober/cordova-plugin-app-version.git
                $scope.version = version;
            });
            $scope.close = function () {
                $modalInstance.dismiss();
            };
        }
    ])
    .controller('confirmTouchIdAssociation', [
        '$scope', '$modalInstance',
        function ($scope, $modalInstance) {
            $scope.close = function (consent) {
                $modalInstance.close(!!consent);
            };
        }
    ])
    .controller('needHelpController', [
        '$scope', '$modalInstance', '$modal',
        function($scope, $modalInstance, $modal){
          $scope.close = function () {
              $modalInstance.close();
          }
          $scope.removeAuthenticatedCodes = function () {
              var removeCodes = localStorageService.remove('authenticatedCodes')
              $modalInstance.close(removeCodes);
              $scope.$emit('notification:success',"Authenticated Codes removed successfully");
          };
          var count = 1;
          $scope.support = function(){
            var interval = setInterval( function(){
              count = count + 1;
            }, 1000);
            if(count == 2){
              $scope.showEnvLink = true;
            }
            else{
              $scope.showEnvLink = false;
            }
          }
          $scope.showEnv = function(){
            var modalInstance = $modal.open({
                windowClass: 'environementModal',
                templateUrl: 'js/features/login/environments.html',
                controller: 'environmentsController'
            });
            // modalInstance.result //reload the monitor list
            // .then(function(codes){
            //
            // });
          }
        }
    ])
    .controller('environmentsController', [
        '$scope', '$rootScope','$modalInstance', '$modal', 'localStorageService', 'synsormed.env.urlBase', 'synsormed.env.url',
        function($scope, $rootScope, $modalInstance, $modal, localStorageService,  urlBase, url){
          $scope.url = 'Select Environment';
          $scope.urls = url;
          $scope.selectedEnv = function(url){
            $scope.url = url;
          }
          $scope.ok = function () {
              localStorageService.set('setEnv', $scope.url);
              urlBase.env = localStorageService.get('setEnv');
              $scope.$emit('notification:success',"Environment set successfully");
              $modalInstance.close();
          }
        }
    ])
    .directive('emptyTypeahead', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attrs, modelCtrl) {
                // this parser run before typeahead's parser
                modelCtrl.$parsers.unshift(function (inputValue) {
                    var value = (inputValue ? inputValue : secretEmptyKey); // replace empty string with secretEmptyKey to bypass typeahead-min-length check
                    modelCtrl.$viewValue = value; // this $viewValue must match the inputValue pass to typehead directive
                    return value;
                });

                // this parser run after typeahead's parser
                modelCtrl.$parsers.push(function (inputValue) {
                    return inputValue === secretEmptyKey ? '' : inputValue; // set the secretEmptyKey back to empty string
                });
            }
        }
    });
