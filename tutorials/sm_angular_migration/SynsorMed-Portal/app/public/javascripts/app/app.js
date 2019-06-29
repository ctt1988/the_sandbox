angular.module('synsormed.portal', [
    'templates',
    'ngRoute',
    'ngAnimate',
    'ngSanitize',
    'ui.bootstrap',
    'uiSwitch',
    'highcharts-ng',
    'ui.select',
    'LocalStorageModule',
    'AuraDropdownModule',
    'synsormed.directives.datepicker',
    'synsormed.directives.toggleList',
    'synsormed.directives.safereading',
    'synsormed.directives.indicatorList',
    'synsormed.directives.healthindicator',
    'synsormed.directives.stackedToggleProgressBar',
    'ui-rangeSlider',
    'synsormed.features.login',
    'synsormed.features.ehr',
    'synsormed.features.provider',
    'synsormed.features.settings',
    'synsormed.features.settings.patient',
    'synsormed.features.register',
    'synsormed.features.insights',
    'synsormed.features.forgot',
    'synsormed.features.emergency',
    'synsormed.features.admin',
    'synsormed.features.organization',
    'synsormed.features.patient.auth',
    'synsormed.features.patient.call',
    'synsormed.components.wait',
    'synsormed.services.user',
    'synsormed.services.encounter',
    'synsormed.services.practice',
    'synsormed.services.pageState',
    'synsormed.services.insight',
    'synsormed.services.monitor',
    'ui.mask',
    'ngComboDatePicker',
    'synsormed.directives.education',
    'synsormed.features.reports',
    'synsormed.features.reports.rpm',
    'synsormed.features.reports.billing',
    'synsormed.directives.exportCSV',
    'synsormed.directives.exportPDF',
    'synsormed.directives.dragdrop',
    'ngMap',
    'synsormed.features.provider.monitor.details',
    'btford.socket-io'
])
    .constant('env', {
        'apiBaseUrl': '/proxy/v1/',
        'appID' : 41633
    })
    .constant('superAdminUrls', [])
    .constant('orgCreatorUrls', [
        '/register'
    ])
    .constant('patientUrls', [
        '/patient/call'
    ])
    .constant('publicUrls', [
        '/',
        '/login',
        '/forgot',
        '/forgot/reset',
        '/forgot/success',
        '/ehr/graph',
        '/ehr/monitor',
        '/emergency',
        '/patient'
    ])
    .config(['$routeProvider', '$httpProvider', 'uiSelectConfig', function ($route, $httpProvider, uiSelectConfig) {
        uiSelectConfig.theme = 'bootstrap';

        //initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
          $httpProvider.defaults.headers.get = {};
        }
        //disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
        // extra
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';

        $httpProvider.defaults.withCredentials = true;
        $httpProvider.defaults.headers.common['x-csrf'] = '"' + sessionStorage.getItem('x-csrf') + '"';
        $httpProvider.defaults.headers.common['X-Session-Token'] = sessionStorage.getItem('X-Session-Token');
        $httpProvider.interceptors.push(['$rootScope', '$q', function($rootScope, $q) {
          return {
            'responseError': function(errorResponse) {
                if(errorResponse.status == 403)
                {
                    $rootScope.$broadcast('session:loggedOut');
                }
                return $q.reject(errorResponse);
            }
          };
        }]);
        $route.when('/', {
            controller: ['$scope', 'synsormed.services.UserService', '$location', function ($scope, UserService, $location) {

                $scope.foo = "";
                if(!UserService.fetchCachedUser()){
                    $location.path('/login');
                }
                else{
                  $location.path('/monitor');
                }
            }],
            template: "<div class='container'><h1>Welcome</h1><p>Please select one of the links on the top to use the application.</p></div>"
        });

        $route.when('/showCode', {
            resolve: {
                encounter: ['synsormed.services.EncounterService', '$route', function (EncounterService, $route) {
                    return EncounterService.getEncounter($route.current.params.id);
                }]
            },
            controller: 'ShowCodeController',
            templateUrl: 'javascripts/app/features/provider/showCode/showCode.html'
        });

        $route.when('/showMonitor', {
            resolve: {
                monitor: ['synsormed.services.MonitorService', '$route', function (MonitorService, $route) {
                    return MonitorService.getMonitor($route.current.params.id);
                }]
            },
            controller: 'ShowMonitorController',
            templateUrl: 'javascripts/app/features/provider/showMonitor/showMonitor.html'
        });


        $route.when('/login', {
            controller: 'LoginController',
            templateUrl: 'javascripts/app/features/login/login.html',
            resolve: {
                removeCurrentUser: [
                    'synsormed.services.UserService',
                    'synsormed.services.WorkListStateService',
                    'synsormed.services.MonitorStateService',
                    'synsormed.services.PatientStateService',
                    '$modalStack',
                    function (UserService, WorkListStateService, MonitorStateService, PatientStateService,  $modalStack) {
                        UserService.clearCachedUser();
                        WorkListStateService.clearState();
                        MonitorStateService.clearState();
                        PatientStateService.clearState();
                        if(!!$modalStack.getTop())$modalStack.dismissAll();
                    }
               ]
            }
        });

        $route.when('/register', {
            controller: 'RegisterController',
            templateUrl: 'javascripts/app/features/register/register.html'
        });

        $route.when('/visits', {
            controller: "VisitsController",
            templateUrl: 'javascripts/app/features/provider/visits/visits.html',
            resolve: {
                users: ['synsormed.services.UserService', function (UserService) {
                    return UserService.fetchAllUsers();
                }]
            }
        });

        $route.when('/ehr/monitor', {
            controller: "EhrMonitorController",
            templateUrl: 'javascripts/app/features/ehr/monitor/monitor.html'
        });

        $route.when('/ehr/graph', {
            controller: "EhrGraphController",
            templateUrl: 'javascripts/app/features/ehr/graph/graph.html'
        });

        $route.when('/monitor', {
            controller: "MonitorController",
            templateUrl: 'javascripts/app/features/provider/monitor/monitor.html',
            resolve: {
                users: ['synsormed.services.UserService', function (UserService) {
                    return UserService.fetchAllUsers();
                }]
            }
        });

        $route.when('/settings', {
            controller: "SettingsController",
            resolve: {
                practice: ['synsormed.services.PracticeService', 'synsormed.services.UserService', function (PracticeService, UserService) {
                    var user = UserService.fetchCachedUser();
                    return PracticeService.getPractice(user.practiceId);
                }]
            },
            templateUrl: 'javascripts/app/features/settings/settings.html'
        });

        $route.when('/insights', {
            controller: "InsightsController",
            templateUrl: 'javascripts/app/features/insights/insights.html'
        });

        $route.when('/reports', {
            controller: "ReportsController",
            templateUrl: 'javascripts/app/features/reports/reports.html',
            resolve: {
                users: ['synsormed.services.UserService', function (UserService) {
                    return UserService.fetchAllUsers();
                }]
            }
        });

        $route.when('/forgot', {
            controller: "ForgotPasswordController",
            templateUrl: 'javascripts/app/features/forgot/forgotLink.html'
        });

        $route.when('/forgot/reset', {
            controller: "ResetPasswordController",
            templateUrl: 'javascripts/app/features/forgot/resetForm.html'
        });

        $route.when('/forgot/success', {
            controller: "ForgotSuccessController",
            templateUrl: 'javascripts/app/features/forgot/forgotSuccess.html'
        });

        $route.when('/emergency',{
            controller: "EmergencyAccessController",
            templateUrl: 'javascripts/app/features/emergency/emergencyAccess.html'
        });

        $route.when('/admin/insights', {
            controller: "AdminInsightsController",
            templateUrl: 'javascripts/app/features/admin/insights/insights.html'
        });

        $route.when('/organization/:id', {
            controller: "OrganizationController",
            templateUrl: 'javascripts/app/features/organization/organization.html'
        });

        $route.when('/patient', {
            controller: "PatientAuthController",
            templateUrl: 'javascripts/app/features/patient/auth.html'
        });

        $route.when('/patient/call', {
            controller: "PatientCallController",
            templateUrl: 'javascripts/app/features/patient/encounter/call.html'
        });
    }])
    .controller('AppContainerController',
    ['$scope', '$window', '$rootScope', '$location', 'synsormed.services.UserService', '$timeout', '$interval', 'isOnPublicUrl', 'synsormed.services.UserService.SuperAdminState','synsormed.services.adminInsight.InsightService',
    function ($scope, $window, $rootScope, $location, UserService, $timeout, $interval, isOnPublicUrl, SuperAdminState, InsightService){
       var directUrl = window.location.href.split('/');
       directUrl = '/' + directUrl[directUrl.length-1];
        if(directUrl != '/' || directUrl != '/login') UserService.directRequestUrl(directUrl); // send url to direct user to specific page

        $rootScope.$on('checkMonitors:license', function () {
          InsightService.checkLicenseExpiration()
          .then(function(resp){
              if(JSON.parse(resp)){
                $rootScope.licenseMsg = 'Your license has been exceeded';
              }
              else{
                 $rootScope.licenseMsg = '';
              }
          })
        });

        $scope.$on('$routeChangeSuccess', function () {
            $scope.currentuser = UserService.fetchCachedUser();
            $scope.superAdmin = SuperAdminState.getState();
        });

        $scope.showBackBtnToAdmin = function(){
           return ($scope.superAdmin) && ($scope.currentuser) && ($scope.currentuser.role !== 'SuperAdmin');
        };

        $scope.goToSuperUserAccount = function(){
            UserService.goToSuperUserAccount()
            .then(function(user){
               UserService.setCachedUser(user);
               $location.path('/admin/insights');
            })
            .catch(function(err){
                console.log(err);
            });
        };

        //check if we the url is active or not
        $scope.isActive = function (viewLocation) {
            return viewLocation === $location.path();
        };
        $scope.$on('session:loggedOut', function() {
            $location.path('/login');
        });
        //check if session not expired
        $interval(function(){
            if(!UserService.fetchCachedUser())
            {
                if(isOnPublicUrl($location.path()))
                {
                    $location.path('/login');
                }
            }
        }, 15000);

        $scope.today = new Date();
        $rootScope.notification = null;

        var notificationTimeout = null;
        $rootScope.showNotification = false;

        $rootScope.showMenu = true;
        $scope.$on('noMenu', function(event, data) {
             $rootScope.showMenu = false;
         });
        $scope.$on('showMenu', function(event, data) {
              $rootScope.showMenu = true;
        });
        $rootScope.$on('notification', function (evt, notification){
            $timeout.cancel(notificationTimeout);
            $rootScope.notification = notification;
            $rootScope.showNotification = true;
            notificationTimeout = $timeout(function () {
                $rootScope.showNotification = false;
                $timeout(function () {
                    if(!$rootScope.showNotification) {
                        $rootScope.notification = null;
                    }
                }, 2000)
            }, 5000);
        });

    }])
    .run([
        '$location',
        '$interval',
        '$rootScope',
        'synsormed.components.wait.WaitService',
        'synsormed.services.UserService',
        '$route',
        'isOnPublicUrl',
        'isSuperAdminUrl',
        'isOrgCreatorUrl',
        'isPatientUrl',
        function ($location, $interval, $rootScope, WaitService, UserService, $route, isOnPublicUrl, isSuperAdminUrl, isOrgCreatorUrl, isPatientUrl) {
        $rootScope.currentuser = window.currentuser;
        $rootScope.page = {
            title: "SynsorMed"
        };

        $rootScope.$on('wait:start', function () {
            WaitService.start();
        });
        $rootScope.$on('wait:stop', function () {
            WaitService.stop();
        });
        $rootScope.$on('wait:forceStop', function () {
            WaitService.forceStop();
        });
        $rootScope.$on('$routeChangeStart',function () {
            WaitService.start();
            $rootScope.page.title = "SynsorMed";
        });
        $rootScope.$on('$routeChangeSuccess',function () {
            WaitService.forceStop();
        });
        $rootScope.$on('$routeChangeError',function () {
            WaitService.forceStop();
            $location.path('/login');
        });

        $rootScope.$on('pageLoaded', function (evt, data) {
            $rootScope.page.title = "SynsorMed: " + data.title;
        });
        var callStarted = false;
        $rootScope.$on('web:chat:started', function (evt, data) {
            callStarted = true;
        });
        $rootScope.$on('web:chat:stopped', function (evt, data) {
            callStarted = false;
        });


        $rootScope.$on( '$routeChangeStart', function(event) {

            var isSuperAdminLink = isSuperAdminUrl($location.path());
            var isOrgCreatorLink = isOrgCreatorUrl($location.path());
            var isPublicLink = isOnPublicUrl($location.path());
            var isPatientLink = isPatientUrl($location.path());
            var user = UserService.fetchCachedUser();

            var forbidden = !user && isPublicLink;
            if(user){

                var unautharizedIfNotSuperAdmin = user && user.role != 'SuperAdmin' && isSuperAdminLink;
                var unautharizedIfNotOrgCreator = user && (user.role != 'SuperAdmin' && user.role != 'OrgCreator') && isOrgCreatorLink;
                var unautharizedIfNotPatient = user && !user.isEncounter && isPatientLink;
                var unautharizedIfNotAdmin = user && user.isEncounter && isPublicLink && !isPatientLink;
            }

            if( unautharizedIfNotOrgCreator || forbidden || unautharizedIfNotSuperAdmin ||  unautharizedIfNotPatient || unautharizedIfNotAdmin){
                event.preventDefault();
                $location.path('/login');
            }
        });


        //check if session expired
        if(!UserService.fetchCachedUser()) {
            if(isOnPublicUrl($location.path()))
            {
                $location.path('/login');
            }
        }

        var lastMouseMove = new Date();
        $( "body" ).mousemove(function( event ) {
            lastMouseMove = new Date();
        });

        $interval(function () {
            var now = new Date();
            if(now.getTime() - lastMouseMove.getTime() > 15*60*1000) {
                if(callStarted) return; // do not logout if call is in progress
                if(isOnPublicUrl($location.path()))
                {
                    $location.path('/login');
                }
                UserService.clearCachedUser();
            }
        }, 30000);
    }])
    .directive('form', [function () {
        return {
            restrict: 'E',
            link: {
                post: function ($scope, $element) {
                    $scope.$emit('setForm', $scope.form);
                }
            }
        };
    }])
    .directive('help', [function () {
        return {
            restrict: 'E',
            replace: true,
            template: "<span class='help'><i class='fa fa-question-circle' popover-placement='right' popover='{{helpText}}' popover-trigger='mouseenter'></span>",
            scope: {
                helpText: '@'
            }
        }
    }])
    .directive('validate', ['$timeout',function ($timeout) {
        return {
            restrict: 'A',
            link: {
                post: function ($scope, $element, attrs) {
                    var status = {
                        dirty: false,
                        invalid: false
                    };

                    var errContainer = $('<small>').addClass('error-container').addClass('ng-hide');
                    var input = $element.find('input');
                    if(!input.length) {
                        input = $element.find('select');
                    }

                    var inputName = input.attr('name');

                    $element.append(errContainer);
                    function getErrorText() {
                    //This is sort of a stub, but it'll work until more complicated validation
                    //cases are introduced.
                        var errors = $scope.form[inputName].$error;
                        for(var errorType in errors) {
                            if(!errors[errorType]) {
                            //There was a validation error, but it's been taken care of
                                continue;
                            }
                            switch(errorType) {
                                case "required": return "This field is required"; break;
                                case "characters": return "This field contains invalid characters"; break;
                                case "email": return "Invalid email format"; break;
                                case "max": return "Value must be less than " + input.attr('max'); break;
                                case "min": return "Value must be greater than " + input.attr('min'); break;
                                case "maxlength": return "Value must be less than " + input.attr('ng-maxlength') + " characters long "; break;
                                case "minlength": return "Value must be greater than " + input.attr('ng-minlength') + " characters long"; break;
                                case "pattern": return "Invalid " + input.attr('name') + " format"; break;
                                case "mask": return "Invalid " + input.attr('name') + " format"; break;
                            }
                            return errorType;
                        }
                    }
                    function updateWrapper() {
                        if(status.dirty) {
                            $element.addClass('dirty');
                        } else {
                            $element.removeClass('dirty');
                        }

                        if(status.invalid && status.dirty) {
                            $element.addClass('has-error');
                            errContainer.text(getErrorText());
                            errContainer.removeClass('ng-hide');
                        } else {
                            errContainer.text('');
                            errContainer.addClass('ng-hide');
                            $element.removeClass('has-error');
                        }
                    }
                    input.on('keyup', function () {
                        updateWrapper();
                    });
                    input.on('blur', function () {
                        updateWrapper();
                    });
                    $scope.$on('$destroy', function () {
                        errContainer.remove();
                    });
                    if($scope.form && inputName) {
                        $scope.$on('validate', function () {
                            if(!input.is('select')) {

                              //prevent two digest loop at same time, timeout by 1 sec
                              $timeout(function() {
                                input.triggerHandler('change');
                              }, 1);

                            } else {
                                status.dirty = true;
                            }
                            updateWrapper();
                        });
                        $scope.$watch('form.' + inputName + '.$dirty', function (newVal) {
                            status.dirty = newVal;
                            updateWrapper();
                        }, true);
                        $scope.$watch('form.' + inputName + '.$invalid', function (newVal) {
                            status.invalid = newVal;
                            updateWrapper();
                        }, true);
                        $scope.$on('setInvalid:' + inputName, function (evt, type) {
                            status.dirty = true;
                            status.invalid = true;
                            $scope.form[inputName].$setValidity(type, false);
                            updateWrapper();
                        });
                        $scope.$on('setValid:' + inputName, function (evt, type){
                            status.dirty = true;
                            status.invalid = false;
                            $scope.form[inputName].$setValidity(type, true);
                            updateWrapper();
                        });
                    }
                }
            }
        };
    }])
    .filter('defaultText',[function(){
        return function(originalValue, text){
            return originalValue ? originalValue : text;
        }
    }])
    .filter('formatDob', [function(){
        return function(dob){
            if(!dob) return 'N/A';
            return moment(dob).format('MMM-DD-YYYY');
        }
    }])
    .filter('secondsToDateTime',[function(){
        return function(seconds){
          return new Date(1970, 0, 1).setSeconds(seconds);
        }
    }])
    .filter('secondsToHoursString',[function(){
      return function(sec){
          var d = 60;

          var templ = ["hrs","min","sec"];

          var times = templ.map(function(v,k){

              //reverse key using circular shift in Math.Pow
              a = parseInt(Math.pow(d,2-(k*k)));
              t = a > 0 ? parseInt(sec / a, 10) : sec;

              //decrease seconds after each calculation
              sec = sec - (t * a);
              return t > 0 ? t +" "+ templ[k] : null;
          });

          times = times.join(" ").trim();

          return times.length == 0 ? "0 sec" : times ;
        };
    }])
    .filter('timerFormat', [function(){
         return function(momentDuration){
             if(!momentDuration) return 'Invalid';
             var hours = momentDuration.hours().toString();
                 hours = hours.length < 2 ? '0' + hours : hours;
             var minutes = momentDuration.minutes().toString();
                 minutes = minutes.length < 2 ? '0' + minutes : minutes;
             var seconds = momentDuration.seconds().toString();
                 seconds = seconds.length < 2 ? '0' + seconds : seconds;
             return hours + ' : ' + minutes + ' : ' + seconds;
         };
    }]).filter('propsFilter', function() {
        return function(items, props) {
            var out = [];

            if (angular.isArray(items)) {
                var keys = Object.keys(props);

                items.forEach(function(item) {
                    var itemMatches = false;

                    for (var i = 0; i < keys.length; i++) {
                        var prop = keys[i];
                        var text = props[prop].toLowerCase();
                        if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
                            itemMatches = true;
                            break;
                        }
                    }

                    if (itemMatches) {
                        out.push(item);
                    }
                });
            } else {
                // Let the output be the input untouched
                out = items;
            }

            return out;
        };
    })
    .directive('tagsInput', [function(){
      return {
        restrict: 'EA',
        transclude: true,
        scope: {
            tags: '=ngModel'
        },
        link: function(scope, element) {
            var tags = scope.tags ? scope.tags.split(',') : [];

            $(element).tagsinput({ mintags: 3, maxTags: 5, confirmKeys: [13, 44]});
            $(element).siblings('div').children('input').css("width", "150px");
            //add tags to the input
            tags.forEach(function(v){
                $(element).tagsinput('add', v);
            });

            //add a single tag, check if its a valid mail type
            $(element).on('beforeItemAdd', function(event) {
                var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
                if(re.test(event.item)){
                    event.cancel = false; //add this tag
                    tags.push(event.item);
                    scope.tags = tags.toString();
                    scope.$apply();
                }
                else {
                    event.cancel = true; // dont add this tag
                }
            });

            //remove a single tag
            $(element).on('beforeItemRemove', function(event) {
                _.pull(tags, event.item);
                scope.tags = tags.toString();
                scope.$apply();
            });

            scope.$on('$destroy', function() {
                $(element).tagsinput('destroy');
            });
        }
      };
    }])
    .directive('threshold',[function(){
      return {
        restrict : 'A',
        scope : {
          safeLevel : "=",
          currentLevel : "="
        },
        link : {
          post : function($scope, $element, attrs){
              if($scope.safeLevel > $scope.currentLevel){
                $element.removeClass('alert-success');
                $element.addClass('alert-warning');
              } else {
                $element.removeClass('alert-warning');
                $element.addClass('alert-success');
              }
          }
        }
      };
    }])
    .directive('showPassword', function() {
        return function linkFn(scope, elem, attrs) {
            scope.$watch(attrs.showPassword, function(newValue) {
                if (newValue) {
                    elem.attr('type', 'text');
                } else {
                    elem.attr('type', 'password');
                };
            });
        };
    })
    /** debounce , an JS techinque that can prevent additional functional calls within defined time **/
    .factory('debounce', ['$timeout',function($timeout) {
        return function(callback, interval) {
            var timeout = null;
            return function() {
                $timeout.cancel(timeout);
                timeout = $timeout(callback, interval);
            };
        };
    }])
    .factory('isOnPublicUrl', ['publicUrls', function(publicUrls) {
        return function(path) {
            return publicUrls.indexOf(path) == -1 ? true : false;
        };
    }])
    .factory('isSuperAdminUrl', ['superAdminUrls', function(superAdminUrls){
        return function(path) {
            return superAdminUrls.indexOf(path) != -1;
        };
    }])
    .factory('isOrgCreatorUrl', ['orgCreatorUrls', function(orgCreatorUrls){
       return function(path){
         return orgCreatorUrls.indexOf(path) != -1;
       };
    }])
    .factory('isPatientUrl', ['patientUrls', function(patientUrls){
        return function(path) {
            return patientUrls.indexOf(path) != -1;
        };
    }])
    .factory('isBrowserSupported', ['$window', function($window) {
        return  /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);// chrome
    }]);
