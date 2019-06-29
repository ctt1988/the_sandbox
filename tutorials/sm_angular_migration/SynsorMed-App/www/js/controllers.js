angular.module('synsormed.controllers', [
    'synsormed.controllers.login',
    'synsormed.controllers.patient.call',
    'synsormed.controllers.patient.agreement',
    'synsormed.controllers.provider.list',
    'synsormed.controllers.provider.createEncounter',
    'synsormed.controllers.provider.showEncounter',
    'synsormed.controllers.patient.pay',
    'synsormed.controllers.patient.connect',
    'synsormed.controllers.provider.notes',
    'synsormed.services.logging',
    'synsormed.controllers.provider.forgotPass',
    'synsormed.controllers.provider.survey',
    'synsormed.controllers.service',
    'synsormed.controllers.network',
    'synsormed.controllers.provider.monitor',
    'synsormed.controllers.monitor.agreement',
    'synsormed.controllers.monitor.read',
    'synsormed.controllers.monitor.appointment',
    'synsormed.controllers.monitor.document',
    'synsormed.controllers.monitor.survey',
    'synsormed.controllers.monitor.guide',
    'synsormed.controllers.monitor.notify',
    'synsormed.controllers.monitor.education',
    'synsormed.controllers.monitor.bluetooth',
    'synsormed.controllers.monitor.helpModal',
    'synsormed.services.syncData',
    'synsormed.controllers.monitor.leaderboard',
    'synsormed.serviceprovider.synsormed'
])
.controller('ApplicationController', [
    '$scope',
    '$rootScope',
    '$timeout',
    '$location',
    '$route',
    'localStorageService',
    'synsormed.services.syncData.c5',
    'synsormed.services.syncData.eclipse',
    'synsormed.services.logging.time',
    'synsormed.services.video.Connector',
    'synsormed.env.googleFit',
    function ($scope, $rootScope, $timeout, $location, $route, localStorageService, c5, eclipse, timeLogging, WeemoConnector, googleFit) {

        // Google Fit related
        $rootScope.gfImp = googleFit;
        $rootScope.gfAvail = false;
        $rootScope.gfOauth = false;
        $rootScope.gfAuthorized = false;

        $scope.notification = {
            type: 'error',
            message: '',
            show: false
        };

        $scope.alterations = {
            body: ''
        };

        var notificationTimeout = null;
        var pauseTime = null;

        //Init SDK plugin on startup
        console.log("*** Init SDKPlugin");
        if(window.sdkPlugin) sdkPlugin.init();

        document.addEventListener("pause", function () {
            //notify application is in background now
            $scope.$broadcast("app:pause");

            pauseTime = new Date();
            timeLogging.log('leaving app');
        }, false);

        document.addEventListener("resume", function () {
            //notify application is in foreground now
            $scope.$broadcast("app:resume");

            if(pauseTime && (new Date()).getTime() - pauseTime.getTime() >= 4 * 60 * 1000) {
                //App has timed out. Disconnect Video and go to login screen
                console.log("Resuming App");
                WeemoConnector.disconnect(true);
                $location.path('#/login');
            }
        });

        //necessary to fix logout issue on android
        $rootScope.$on('prevent:pause:timeout', function (err) {
             pauseTime = null; //reset pause time
        });

        $rootScope.$on('$routeChangeError', function (err) {
            timeLogging.log('$routeChangeError');
        });


        var notificationId = null;

        /**
        * These should be collapsed into a less repetative factory
        */
        $rootScope.$on('notification', function (evt, message) {
            $scope.notification = message;
            $scope.notification.show = true;
            if(notificationId) {
                $timeout.cancel(notificationId);
            }
            notificationId = $timeout(function () {
                $scope.notification.show = false;
            }, 5000);
        });

        $rootScope.$on('service:error', function (evt, errorModel) {
            $scope.$emit('notification', {
                type: 'danger',
                message: errorModel.toString()
            });
        });

        $rootScope.$on('notification:error', function (evt, message) {
            $scope.$emit('notification', {
                type: 'danger',
                message: message
            });
        });

        $rootScope.$on('notification:information', function (evt, message) {
            $scope.$emit('notification', {
                type: 'info',
                message: message
            });
        });

        $rootScope.$on('notification:success', function (evt, message) {
            $scope.$emit('notification', {
                type: 'success',
                message: message
            });
        });

        $rootScope.$on('notification:warning', function (evt, message) {
            $scope.$emit('notification', {
                type: 'warning',
                message: message
            });
        });

        $rootScope.$on('checkAlarm', function(evt, parsedString){
            if(!parsedString)  return;
            var lastAlarm = localStorageService.get('synsormed:lastAlarmValue');
            if(lastAlarm){
                if(lastAlarm != parsedString.alarm){

                    if(parsedString.batteryStatus){ //if the parsed string has battery status then it is an eclipse (until comfort)
                        eclipse.sync(true);
                    }else{
                        c5.sync(true); // upload data when alarm changed
                    }
                }
            }
            localStorageService.set('synsormed:lastAlarmValue', parsedString.alarm);
        });

        $rootScope.$on('c5DeviseLost', function(evt, parsedString){
            if(!parsedString) return;
            c5.startSyncWithMonitor(parsedString);
        });

    }]);
