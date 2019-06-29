angular.module('synsormed', [
    'synsormed.controllers',
    'synsormed.components.wait',
    'synsormed.components.network2',
    'synsormed.components.header',
    'ngRoute',
    'ngTouch',
    'ngAnimate',
    'ui.bootstrap',
    'ui.bootstrap.datepicker',
    'LocalStorageModule',
    'synsormed.services.provider',
    'synsormed.services.survey',
    'synsormed.services.user',
    'synsormed.services.media',
    'synsormed.services.encounter',
    'synsormed.services.notification',
    'synsormed.controllers.messages'
])
    .config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
        $httpProvider.defaults.useXDomain = true;

        //initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        $httpProvider.interceptors.push(function() {
            return {
                'request': function (config) {
                    //console.log(config);
                    if(config.method === 'GET' && config.cache === undefined) {
                        config.cache = false;
                    }
                    return config;
                }
            };
        });
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
        $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';

        $routeProvider
            .when("/network", {templateUrl: "js/features/network/network.html", controller: "networkController"})
            .when("/login", {templateUrl: "js/features/login/loginPatient.html", controller: "loginViewController"})
            .when("/login/patient", {templateUrl: "js/features/login/loginPatient.html", controller: 'patientLoginViewController'})
            .when("/login/provider", {templateUrl: "js/features/login/loginProvider.html", controller: 'providerLoginViewController'})

            .when("/patient/terms", {templateUrl: "js/features/patient/agreement/agreement.html", controller: "patientAgreementController"}).
                when("/patient/pay", {
                    templateUrl: "js/features/patient/pay/pay.html",
                    controller: 'patientPayController',
                    resolve: {
                        Stripe: ['$q', '$interval', function ($q, $interval) {
                            var deferred = $q.defer();
                            if(window.Stripe) {
                                deferred.resolve();
                            } else {
                                var script = document.createElement('script');
                                script.src = "https://js.stripe.com/v2/";
                                $("head").append(script);
                                var checkInterval = $interval(function () {
                                    if(window.Stripe) {
                                        $interval.cancel(checkInterval);
                                        deferred.resolve();
                                    }
                                }, 10);
                            }
                            return deferred.promise;
                        }]
                    }
                }).
                when("/patient/call", {templateUrl: "js/features/patient/call/call.html", controller: "patientCallController"}).
                when("/patient/survey", {
                    templateUrl: "js/features/patient/survey/survey.html", controller: "patientSurveyController",
                    resolve: {
                        encounter: ['synsormed.services.encounter.EncounterService','synsormed.services.user.UserService', function (EncounterService, UserService) {
                            var user = UserService.getUser();
                            return EncounterService.getEncounter(user.id);
                        }]
                    }
                }).
                when("/provider/call", {templateUrl: "js/features/provider/call/call.html", controller: "providerCallController"}).
                when("/provider/forgotpass", {templateUrl: "js/features/provider/forgotPass/forgotPass.html", controller: "providerForgotPassController"}).

                when("/provider/writeNote", {
                    templateUrl: "js/features/provider/notes/notes.html",
                    controller: "providerNoteWritingController",
                    resolve: {
                        encounter: ['$route', 'synsormed.services.encounter.EncounterService', function ($route, EncounterService) {
                            return EncounterService.getEncounter($route.current.params.patientId);
                        }]
                    }
                }).
                when("/provider/Create/Encounter", {
                    controller: 'createEncounterController',
                    templateUrl: "js/features/provider/encounter/createEncounter.html"
                }).
                when("/showEncounter", {
                    resolve: {
                        encounter: ['synsormed.services.encounter.EncounterService', '$route', function (EncounterService, $route) {
                            return EncounterService.getEncounter($route.current.params.id);
                        }]
                    },
                    controller: 'ShowEncounterController',
                    templateUrl: "js/features/provider/showEncounter/showEncounter.html"
                }).
                when("/provider/list", {
                    templateUrl: "js/features/provider/list/list.html",
                    controller: "patientListController",
                    resolve: {
                        waiting: ['synsormed.services.provider.ProviderService','synsormed.services.user.UserService', function (ProviderService, UserService) {
                            var user = UserService.getUser();
                            return ProviderService.listWaitingPatients(user.id);
                        }],
                        worklist: ['synsormed.services.provider.ProviderService','synsormed.services.user.UserService', function (ProviderService, UserService) {
                            var user = UserService.getUser();
                            return ProviderService.getWorkList(user.id);
                        }]
                    }
                }).
                when("/logout", {
                    controller: ['$http', '$location', 'localStorageService', function ($http, $location, localStorageService) {
                        $http.defaults.headers.common['X-Session-Token'] = null;
                        localStorageService.remove('X-Session-Token')
                        $location.path('/login/patient')
                    }],
                    template: '<div></div>'
                }).
                when("/patient/connect", {
                  templateUrl: "js/features/patient/connect/connect.html",
                  controller: "patientConnectController"
                }).
                when("/service/list", {
                  templateUrl: "js/features/service/list.html",
                  controller: "serviceListController"
                })
                .when("/provider/monitor", {
                  templateUrl: "js/features/provider/monitor/monitor.html",
                  controller: "MonitorListController"
                })
                .when("/monitor/terms", {
                  templateUrl: "js/features/monitor/agreement/agreement.html",
                  controller: "MonitorAgreementController"
                })
                .when("/monitor/read", {
                  templateUrl : "js/features/monitor/read/read.html",
                  controller : "MonitorReadController"
                })
                // .when("/monitor/guide/:monitorId/:measurementId", {
                //   templateUrl : "js/features/monitor/guide/guide.html",
                //   controller : "MonitorGuideController"
                // })
                .when("/monitor/guide", {
                  templateUrl : "js/features/monitor/guide/guide.html",
                  controller : "MonitorGuideController"
                })
                .when("/monitor/appointment", {
                  templateUrl : "js/features/monitor/appointment/appointment.html",
                  controller : "MonitorAppointmentController"
                })
                .when("/monitor/documents", {
                  templateUrl : "js/features/monitor/document/document.html",
                  controller : "MonitorDocumentController"
                })
                .when("/monitor/survey/:monitorId/:measurementId",{
                    templateUrl: "js/features/monitor/survey/survey.html",
                    controller: "MonitorSurveyController"
                })
                .when("/monitor/survey/step",{
                    templateUrl: "js/features/monitor/survey/step-survey.html",
                    controller: "MonitorSurveyController"
                })
                .when("/monitor/notify/:monitorId", {
                    templateUrl: "js/features/monitor/notify/notify.html",
                    controller: "MonitorNotifyController"
                })
                .when("/monitor/education", {
                    templateUrl: "js/features/monitor/education/education.html",
                    controller: "MonitorEducationController"
                })
                .when("/monitor/bluetooth", {
                    templateUrl: "js/features/monitor/bluetooth/bluetooth.html",
                    controller: "MonitorBluetoothController"
                })
                .when('/messages', {
                    templateUrl: 'js/features/messages/messages.html',
                    controller: 'MessagesController'
                })
                .when('/monitor/leaderboard', {
                    templateUrl: 'js/features/monitor/leaderboard/leaderboard.html',
                    controller: "MonitorLeaderboardController"
				})
                .when('/serviceprovider/synsormed', {
                    templateUrl: 'js/features/serviceprovider/synsormed/synsormed.html',
                    controller: 'SynsorMedController'
                })
                .when('/serviceprovider/synsormed/:measurementName', {
                    templateUrl: 'js/features/serviceprovider/synsormed/logData.html',
                    controller: 'logDataController'
                })
                .otherwise({redirectTo: '/login'});
    }])
    .directive('pullToRefresh', ['$interval', '$timeout', function ($interval, $timeout) {
        return {
            restrict: 'A',
            scope: {
                'pullToRefresh': '='
            },
            link: {
                post: function ($scope, $element, attrs) {
                    console.log("Starting pull to refresh", $element[0])
                    var myScroll, doReload;
                    $timeout(function () {

                        myScroll = new IScroll($element[0], {
                            probeType: 2,
                            preventDefault: true,
                            bindToWrapper: true,
                            click: true,
                            tap: true //fix issue on scoll on 4.4
                            // preventDefaultException: {
                            //   tagName: /^(A)$/,
                            // }
                        });
                        myScroll.on('scroll', function () {
                            if(this.distY + this.startY > 0) {
                                $element.addClass('pulling');
                            }
                            if(this.distY + this.startY > 50) {
                                doReload = true;
                            } else {
                                doReload = false;
                            }
                        });
                        myScroll.on('scrollEnd', function () {
                            $element.removeClass('pulling');
                            if(doReload) {
                                doReload = false;
                                $scope.pullToRefresh();
                            }
                        });
                    }, 100);

                    var refreshInterval = $interval(function () {
                        var ulHeight = $element.find('ul').innerHeight();
                        var parentHeight = $element.parent().outerHeight();
                        myScroll.maxScrollY = ulHeight > parentHeight ? (ulHeight - parentHeight) * -1 : 0;
                    }, 1000);
                    $scope.$on('$destroy', function () {
                        myScroll.destroy();
                        $interval.cancel(refreshInterval);
                    });
                }
            }
        }
    }])
    .directive('form', ['$timeout', function ($timeout) {
        return {
            restrict: 'E',
            link: {
                post: function ($scope, $element) {
                    $scope.$emit('setForm', $scope.form);

                    var t = $timeout(function () {
                        $element.find('input,select').first(':visible').focus();
                    }, 300);

                    $scope.$on('$destroy', function () {
                        $timeout.cancel(t);
                    });

                }
            }
        };
    }])
    /**
     * This directive takes care of some of the styling necessary to show an invalid
     * form item. It's more complex than it needs to be due to ionic, but it works.
     */
    .directive('validate', function () {
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

                    if(attrs.noMsg === undefined) {
                        $element.append(errContainer);
                    }
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
                            }
                            return errorType;
                        }
                    }
                    function updateWrapper() {
                        console.log(status)
                        if(status.dirty) {
                            $element.addClass('dirty');
                        } else {
                            $element.removeClass('dirty');
                        }
                        if(status.invalid && status.dirty) {
                            $element.addClass('has-error');
                            errContainer.text(getErrorText());
                            errContainer.removeClass('ng-hide');
                            $element.removeClass('has-success');
                        } else if (status.dirty && !status.invalid) {
                            $element.addClass('has-success');
                            $element.removeClass('has-error');
                            errContainer.text('');
                            errContainer.addClass('ng-hide');
                        } else {
                            errContainer.text('');
                            errContainer.addClass('ng-hide');
                            $element.removeClass('has-error');
                            $element.removeClass('has-success');
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
                                input.triggerHandler('change');
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
                            $scope.form[inputName].$setValidity(type, false);
                            updateWrapper();
                        });
                        $scope.$on('setValid:' + inputName, function (evt, type) {
                            status.dirty = true;
                            $scope.form[inputName].$setValidity(type, true);
                            updateWrapper();
                        });
                    }
                }
            }
        };
    })
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
    .run([
        '$rootScope',
        '$http',
        'localStorageService',
        'synsormed.components.wait.WaitService',
        '$timeout',
        '$interval',
        '$location',
        'synsormed.env.network.scan.check',
        'synsormed.services.user.UserService',
        'synsormed.components.network2.NetworkBackgroundScanService',
        function ($rootScope, $http, localStorageService, WaitService, $timeout, $interval, $location, scanInterval, UserService, NetworkBackgroundScanService) {

        if(localStorageService.get('x-csrf')) {
            $http.defaults.headers.common['x-csrf'] = '"' + localStorageService.get('x-csrf') + '"';
        }
        if(localStorageService.get('X-Session-Token')) {
            $http.defaults.headers.common['X-Session-Token'] = localStorageService.get('X-Session-Token');
        }
        $rootScope.$on('wait:start', function () {
            WaitService.start();
        });
        $rootScope.$on('wait:stop', function () {
            WaitService.stop();
        });
        $rootScope.$on('wait:forceStop', function () {
            WaitService.forceStop();
        });
        $rootScope.$on('$routeChangeSuccess',function () {
            $timeout(function () {
                var user = UserService.getUser();
                $rootScope.loggedIn = (!!user.id);
            }, 10);
        });

        //start network shallow scans
        $rootScope.$on('network:scan:start',function () {
          NetworkBackgroundScanService.startScan();
        });

        //end network shallow scans
        $rootScope.$on('network:scan:stop',function () {
          NetworkBackgroundScanService.stopScan();
        });

        //keep checking network
        $interval(function () {
            $rootScope.hasHighBandwidth = NetworkBackgroundScanService.hasHighBandwidth();
        }, scanInterval);

        $rootScope.back = function () {
            window.history.back();
        };

        if(window.StatusBar) {
            StatusBar.overlaysWebView(false);
            StatusBar.hide();
        }
    }])
    /** An JS pattern that can repeat a promise for N number of time
     In terms of angular factory format **/
    .factory('repeater',['$q','$timeout',function($q,$timeout){

        /* Base for an recursive repeater
          tries : Int : Number of time we will try
          repeatInterval : Millisec : Time after which next try will occur
        */
        var execute = function(promise,tries,repeatInterval,context,args,result){

          promise.apply(context,args)
          .then(function(data){
            result.resolve(data);
          })
          .catch(function(err){
              if(tries < 1){
                result.reject(err);
              } else {
                $timeout(function(){
                  console.log('repeating time ' + tries);
                  execute(promise, tries - 1, repeatInterval, context, args, result);
                },repeatInterval);
              }
          });

        };

        return function(promise,tries,repeatInterval,context,args){

            var result  = $q.defer();

            //context and arguments for promise execution
            context = context || null;
            args = args || [];

            //default repeat after 10 sec
            repeatInterval = repeatInterval || 10000;

            //begin repeating process
            execute(promise,tries,repeatInterval,context,args,result);

            return result.promise;
        };
    }])
    .directive('slider', [function () {
        return {
            scope: {
                check: '='
            },
            restrict: 'A',
            link: function(scope, element, attr) {
                  $(element).bootstrapSwitch({
                    state: scope.check,
                    size: 'small',
                    onColor: 'success',
                    offColor: attr.offcolor,
                    onText: attr.ontext,
                    offText:  attr.offtext,
                    onSwitchChange: function(event, val){
                        scope.check = val;
                    }
                  });
                }
            };
    }])
    .directive('toggleBtn', ['$timeout', function ($timeout) {
        return {
            scope: {
                check: '='
            },
            restrict: 'A',
            link: function(scope, element, attr) {
                $(element).bootstrapToggle({
                   on: "",
                   off: "",
                   size: "normal",
                   width: null,
                   height: null
               });

               $(element).bootstrapToggle(scope.check ? 'on' : 'off');
               $timeout(function(){
                    scope.$apply();
               },0);

               $(element).change(function() {
                   scope.check = $(this).prop('checked');
                   $timeout(function(){
                        scope.$apply();
                   },0);
               });
            }
        };
    }])
    .directive('flipTile', [function () {
        return {
            restrict: 'A',
            link: function(scope, element, attr) {
                $(element).click(function(){
                    var c = element[0].classList;
                    c.contains("flipped") === true ? c.remove("flipped") : c.add("flipped");
                });
            }
        };
    }])
    .directive('rangeCheker', [function () {
        return {
            restrict: 'A',
            link: function(scope, element, attr) {
                var timer = null;
                $(element).on('input', function(){
                    if(timer) {
                        clearTimeout(timer)
                        timer= null;
                    }
                    timer = setTimeout(function(){
                        var rangeMax = parseFloat(attr.rangeMax);
                        var rangeMin = parseFloat(attr.rangeMin);
                        var value = $(element).val();
                        if(value > rangeMax) value = rangeMax;
                        if(value < rangeMin) value = rangeMin;
                        $(element).val(value);
                        $(element).trigger('input');
                    },0);
                });

            }
        };
    }]);
