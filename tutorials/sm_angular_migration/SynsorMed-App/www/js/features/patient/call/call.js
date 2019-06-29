angular.module('synsormed.controllers.patient.call', [
    'synsormed.services.user',
    'synsormed.services.weemo',
    'synsormed.services.logging',
    'synsormed.services.patient',
    'synsormed.services.oauth',
    'synsormed.services.authentication',
    'synsormed.services.awake',
    'synsormed.services.location'
])
.controller('patientCallController', [
    '$scope',
    '$interval',
    '$location',
    'synsormed.services.video.Connector',
    'synsormed.services.user.UserService',
    'synsormed.services.patient.PatientService',
    'synsormed.services.encounter.EncounterService',
    'synsormed.services.logging.time',
    'media',
    'repeater',
    'synsormed.services.oauth.OauthService',
    'synsormed.services.oauth.OauthDataManagementService',
    'synsormed.services.authentication.Login',
    'localStorageService',
    '$q',
    'synsormed.services.awake.awakeService',
    'synsormed.services.location.locationService',
    function($scope, $interval, $location, videoConnector, UserService, PatientService, EncounterService, TimeLogger, Media, repeater, OauthService,
        OauthDataManagementService, LoginService, localStorageService, $q, awakeService, locationService) {

        //Keep app awake while in call and waiting room
        awakeService.keepAwake();

        var permissionController = cordova.plugins.permissions;
        var permissionsList = [
            permissionController.RECORD_AUDIO,
            permissionController.CAMERA,
            permissionController.MODIFY_AUDIO_SETTINGS,
            permissionController.ACCESS_FINE_LOCATION  
        ];

        var updateEncounterData = function(){
           var defer = $q.defer();

           //get connected services
            LoginService.getAvailableData()
           .then(function(data){
                var encounter = UserService.getUser();
                return EncounterService.linkServices(encounter.id, data);
            })
            .then(function(response){
                defer.resolve(response);
            })
            .catch(function(err){
                 defer.reject;
            });

           return defer.promise;
        };

        $scope.syncEncounters = function(sync){
            //if we are allowed to send data in this session
            if(!OauthDataManagementService.canSendData()){
                console.log('Permision denied');
                return;
            }
            else if( !sync) return;

            updateEncounterData()
            .then(function(){
               $scope.$emit('notification:success', 'Service data uploaded');
            })
            .catch(function(){
               $scope.$emit('notification:error', 'Service data syncing failed');
            });

        };

        var autoSync = !localStorageService.get('stopAutoSyncEncounterData');
        localStorageService.set('stopAutoSyncEncounterData', true);
        $scope.syncEncounters(autoSync);

        var checkOauthExpired = function() {
            var user = UserService.getUser();
            OauthService.checkOauthExpired(user.id).then(function(expired) {
                //remove the linked service if token expired
                if (expired === true) {
                    OauthService.clearStoredService();
                    $scope.$emit('notification:warning', "Access to Sensor Expired. Unlinking Sensor.");
                }

            }).catch(function(e) {
                console.error(e);
            });
        };

        checkOauthExpired();

        /**
        * Using $scope.$watch doesn't work here for some reason - maybe
        * due to the window losing focus?
        */
        var lastCallStatus = null;
        var weemoCallStatusInterval;
        var codeName = null;

        function checkProviderStatus() {
            var user = UserService.getUser();
            TimeLogger.log("InCallScreen");
            PatientService.getProviderStatus(user.providerId).then(function(resp) {
                $scope.providerOnline = resp.online;
            });
        }

        var providerStatusInterval = $interval(checkProviderStatus, 20000);
        checkProviderStatus();

        $scope.$on('$destroy', function() {
            // Allow app to sleep again
            awakeService.allowSleep();

            EncounterService.dropToken(user.id);
            $interval.cancel(weemoCallStatusInterval);
            $interval.cancel(providerStatusInterval);
            $interval.cancel(rtcIdCheckInterval);
            //WeemoConnector.removeCall();
            //WeemoConnector.disconnect(true);

            if (audio) {
                isPlaying = false;
                audio.stop();
                audio = null;
            }
        });

        $scope.pickUp = function() {
            //stop network scan
            $scope.$emit('network:scan:stop');

            //get current user
            var user = UserService.getUser();

            //patient has started the call
            EncounterService.markCallEvent(user.id, EncounterService.EVENT.START);

            //pick up the call
            videoConnector.pickUpCurrentCall();
        };

        $scope.status = 'connecting';

        var isPlaying = false, audio;

        $scope.$watch('status', function() {
            if ($scope.status == 'ringing' && !isPlaying) {
                audio = new Media('media/physician-calling.mp3', null, null, function(status) {
                    if (status === Media.MEDIA_STOPPED && isPlaying) {
                        audio.play();
                    }
                });

                audio.play();
                isPlaying = true;
            } else if ($scope.status != 'ringing') {
                isPlaying = false;
                if (audio) {
                    audio.stop();
                    audio = null;
                }
            }
        });

        var callHappened = false;
        var user = UserService.getUser();
        var userToken = null;
        var rtcIdCheckInterval = null;

        //the Rttc plugin emits call changes
        $scope.$on('callchange', function(event, data) {
            console.log("I received the emit from the broadcast: " + data);
            lastCallStatus = data;
            switch (data) {
                case "NONE":
                if ($scope.status != 'connecting') {
                    if (lastCallStatus === null) {
                        TimeLogger.log("WaitingOnPhysician");
                    }
                    $scope.status = 'waiting';
                }
                break;
                case "CREATED":
                //WeemoConnector.callWasCreated();
                break;
                case "RINGING":
                if (lastCallStatus != "RINGING") {
                    TimeLogger.log("DeviceRinging");
                }
                $scope.status = 'ringing';
                break;
                case "ACTIVE":
                if (lastCallStatus != "ACTIVE") {
                    TimeLogger.log("CallActive");
                }
                videoConnector.startCallTimer();
                callHappened = true;
                $scope.status = 'active';
                break;
                case "ENDED":

                // necessary to clear the pause timeout on android
                $scope.$emit('prevent:pause:timeout');

                if (lastCallStatus != "ENDED") {
                    TimeLogger.log("CallComplete");
                    lastCallStatus = null;
                }
                $scope.status = 'complete';
                //WeemoConnector.removeCall();
                //WeemoConnector.disconnect(true);
                if (callHappened) {

                    //get current user
                    var user = UserService.getUser();

                    //If call is ending and callHappened, tell the server to remove the
                    //rtcID from the encounter's row. That is done by sending the service
                    //the ID of the encounter and not the code.

                    //repeater(EncounterService.dropToken, 2, 1000, this, [user.id]).then(function() {
                    //    $location.path('/patient/survey');
                    //});

                     $location.path('/patient/survey');
                }

                //get duration of this call
                var lastCallSeconds = videoConnector.recordLastCallDuration();
                //var lastCallSeconds = WeemoConnector.getLastCallDuration();
                if (callHappened && (lastCallSeconds != undefined || lastCallSeconds > 0)) {
                    // update encounter for call duration
                    EncounterService.logEncounterCallDuration(user.id, lastCallSeconds);
                }

                callHappened = false;

                //start the network scan again
                $scope.$emit('network:scan:start');

                break;
            }
        });

        $scope.startRTCCHECKInterval = function(){
            rtcIdCheckInterval = $interval(function(){
                if(codeName)
                {
                    // WeemoConnector
                    // .isRtcIDConnected(codeName)
                    // .then(function(isConnected){
                    //     if(!isConnected) {
                    //         $scope.stopRTCCHECKInterval();
                    //         encounterWeemoAuth();
                    //     }
                    // })
                    // .catch(function(err){
                    //     console.log(err);
                    // });
                }
            }, 15000);
        };

        $scope.stopRTCCHECKInterval = function(){
            $interval.cancel(rtcIdCheckInterval);
        };
        var encounterVideoAuth = function(){
            $scope.stopRTCCHECKInterval();
            //EncounterService.getToken(user.id).then(function(token) {
            //    userToken = token;
            //    return WeemoConnector.initialize();
            //})
            return videoConnector.initialize().then(function() {
                console.log("Authenticating");
                //repeat the authenticate process three times, after each 1 sec
                return repeater(videoConnector.authenticate, 3, 1000, this, [user.code]);
            }).then(function() {
                //videoConnector.setName(user.code);
                console.log("Authenticated");
                //patient is ready for call
                $scope.status = 'waiting';
                return EncounterService.markCallEvent(user.id, EncounterService.EVENT.READY);
            })
            //.then(function(){
            //    EncounterService
            //    .getCodeName(user.id)
            //    .then(function(data){
            //        codeName = data;
                    //start interval after setting codeName
                    //$scope.startRTCCHECKInterval();
             //   });
            //})
            .catch(function(err) {
                console.log(err);
                $scope.$emit('notification:error', "Unable to connect with Video Service");
                $location.path('/logout');
            });
        };

        var handlePermissionsError = function(err){
            console.log("*** About to handle permissions error: " + JSON.stringify(err));

            $scope.$emit('notification:error', "Camera and/or Mic permissions are required");
            $location.path('/logout');
        }

        permissionController.checkPermission(permissionsList, function(success_msg){
            if(!success_msg.hasPermission){
                console.log("*** All required permissions are not enabled, going to request them now: " + JSON.stringify(success_msg));
                permissionController.requestPermissions(permissionsList,function(status){
                    if(!status.hasPermission){
                        //This means that the permissions were requested but denied
                        console.log("*** The user denied the required permissions: " + JSON.stringify(status));
                        handlePermissionsError(status);
                    }else{
                        //This means that the permissinos were accepted by the user, so proceed
                        encounterVideoAuth();
                    }
                },function(err){
                    console.log("*** There was an issue when requesting permissions: " + JSON.stringify(err));
                    handlePermissionsError(err);
                });
            }else{
                console.log("*** Permissions already exists: " + JSON.stringify(success_msg));
                encounterVideoAuth();
            }       

        }, function(error_msg){
            console.log("*** Had an error when checking permissions: " + JSON.strigify(error_msg));
            handlePermissionsError(error_msg);
        });

        //encounterVideoAuth();
        //$scope.startRTCCHECKInterval();
        locationService.getLocation() // update location
        .then(function(location){
            return locationService.updateEncounterLocation(user.id, location);
        })
        .catch(function(err){
            console.log(err);
        });
    }
]);
