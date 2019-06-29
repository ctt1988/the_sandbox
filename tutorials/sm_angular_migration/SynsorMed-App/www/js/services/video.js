angular.module('synsormed.services.weemo', [
    'synsormed.env',
    'synsormed.services.user'
]).service('synsormed.services.video.Connector', [
    'synsormed.services.user.UserService',
    'synsormed.env.weemo.appId',
    '$q',
    function (UserService, appId, $q) {

    if(!window.videoPlugin) {
        console.error("!!!!!!!!! VIDEO SERVICE NOT ACTIVE !!!!!!!!!");
    }
    var hasAuthenticated = false, authenticationUserId = null;

    var lastCallDuration = 0 , beginCallTimestamp = 0;

    var service = {


    	initVideoSystem : function(){

    		videoPlugin.initVideo();

    	},

    	startCallTimer : function(){

    		beginCallTimestamp = (new Date).getTime();
    		console.log("In JS, the call started on: " + beginCallTimestamp);

    	},

        getLastCallDuration : function(){
            return lastCallDuration;
        },
        //record call duration
        recordLastCallDuration : function(){
            //if call was never recorded then
            if(beginCallTimestamp === undefined || beginCallTimestamp === 0) {
               return 0;
            }

            lastCallDuration = (new Date).getTime() - beginCallTimestamp;
            //convert to seconds
            lastCallDuration = parseInt(lastCallDuration / 1000);
            return lastCallDuration;
        },

        //display the call window again from JS
        displayCallWindow : function(){

          if(!service._call.callObj) {
              return false;
          }

          service._call.callObj.displayCallWindow(false, null);
        },

        initialize: function () {
            console.log('Initializing Video');
            var networkGrade = UserService.getNetworkGrade();
            this._call = {
                status: service.CallStatus.NONE
            };
            var deferred = $q.defer();
            try {

                deferred.promise.catch(function () {
                    console.log("Initialization failed");
                });
                deferred.promise.then(function () {
                    console.log("Initialization succeeded");
                });
                if(hasAuthenticated) {
                    console.log("Skipping actual initialization");
                    deferred.resolve();
                } else {
                    videoPlugin.initialize(appId, deferred.resolve, deferred.reject);
                }
                //service.setup();
            } catch (e) {
                console.error("!!!!!!!!! VIDEO SERVICE NOT ACTIVE !!!!!!!!!");
                deferred.reject({
                    error: "Could not initialize Video"
                });
            }
            return deferred.promise;
        },
        //
        disconnect: function (permanentDisconnect) {
            try {
                permanentDisconnect = permanentDisconnect || false;
                if(permanentDisconnect)
                {
                    hasAuthenticated = false;
                    authenticationUserId = null;
                    videoPlugin.disconnect();
                }
                else {
                    authenticationUserId = null;
                }
            } catch(e) {
                //ignore
            }
        },
        authenticate: function (userId) {
            authenticationUserId = userId;
            var deferred = $q.defer();
            console.log("Authenticating....." + JSON.stringify(userId));
            if(hasAuthenticated) {
                deferred.resolve();
            } else {
                videoPlugin.authenticate(
                    userId,
                    null,
                    function (resp) {
                        console.log("Inside auth success funct in JS:: " + resp);
                        if(resp!="OK") {
                            deferred.reject({
                                error: resp
                            });
                        } else {
                            hasAuthenticated = true;
                            deferred.resolve();
                        }
                    },
                    function (err) {
                        console.log("Authentication failed");
                        var error = "";
                        switch(err) {
                            case Weemo.Error.NETWORK_ERROR: error = "NETWORK_ERROR"; break;
                            case Weemo.Error.BAD_APIKEY: error = "BAD_APIKEY"; break;
                            case Weemo.Error.NOT_CONNECTED: error = "NOT_CONNECTED"; break;
                            case Weemo.Error.ALREADY_AUTHENTICATED: error = "ALREADY_AUTHENTICATED"; break;
                            case Weemo.Error.NETWORK_LOST: error = "NETWORK_LOST"; break;
                            case Weemo.Error.CLOSED: error = "CLOSED"; break;
                            case Weemo.Error.SIP_NOK: error = "SIP_NOK"; break;
                        }
                        deferred.reject({
                            error: error
                        });
                    }
                );
            }
            deferred.promise.then(function () {
                console.log("Authentication succeeded");
            });
            return deferred.promise;
        },
        hasCall: function () {
            return service._call && !!service._call.callObj;
        },
        getCallStatus: function () {
            return service._call.status;
        },
        removeCall: function () {
            try {
                service.disconnectCall();
            } catch (e) { console.log("Did not disconnect due to " + JSON.stringify(e)) }
            delete service._call.callObj;
            service._call.status = service.CallStatus.NONE;
        },
        setName: function (displayName) {
            Weemo.setDisplayName(displayName);
        },
        disconnectCall: function () {
            /*if(service._call.callObj) {
                service._call.callObj.hangup();
            }*/
            videoPlugin.hangUp();
        },
        /**
      	 * createCall to a user
      	 * @param String recipientId , The recipientId to call to
         * @param Boolean isProvider , Is Provider Calling
      	 * @param Boolean allowSwitch , The switch is allowed or not
      	 */
        createCall: function (recipientId, isProvider, allowSwitch, callTokens) {
            var deferred = $q.defer();
            authenticationUserId = callTokens ? callTokens : authenticationUserId;

            allowSwitch = allowSwitch || false;
            isProvider = isProvider || false;

            if(hasAuthenticated) {
                videoPlugin.createCall(recipientId, isProvider, allowSwitch, deferred.resolve, deferred.reject);
            } else {
                this.authenticate(authenticationUserId).then(function () {
                    videoPlugin.createCall(recipientId, isProvider, allowSwitch, deferred.resolve, deferred.reject);
                });
            }
            return deferred.promise;
        },

        /**
         * Check if a RTC ID is connect on Weemo Server or not
         *
         * @param String , rtcId , The Weemo id for user connected
         *
         */
        isRtcIDConnected: function(rtcId){
            var deferred = $q.defer();
            console.log('CHECKING IS RTC ID CONNECTED');
            console.log(rtcId);
            videoPlugin.getStatus(rtcId, function(isConnected){
                if(isConnected === true){
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
            });
            return deferred.promise;
        },

        /**
      	 * Resume a call
         * @param Boolean isProvider , Is Provider Calling
      	 */
        pickUpCurrentCall: function (isProvider) {

            isProvider  = isProvider || false;

			videoPlugin.acceptCall();

            //if(!service._call.callObj) {
             //   return false;
            //}

            //service._call.callObj.resume(isProvider);

            //service._call.status = service.CallStatus.ACTIVE;

            //Commenting this out so that displayCallWindow ONLY gets called once the status
            //changes to active. See oncallstatuschanged function below
            //console.log("Displaying call view from JS");
            //service._call.callObj.displayCallWindow(false, null);
        },
        callWasCreated: function(){
        	//alert("Call was created in js");

        },
        setup: function () {

            var self = this;
            Weemo.onConnectionChanged = function (status) {
                if(status === Weemo.Error.NETWORK_LOST) {
                    hasAuthenticated = false;
                }
            };
            Weemo.onCallCreated = function(callObj) {
                service._call = {
                    callObj: callObj,
                    status: service.CallStatus.WAITING
                };
                console.log("Service call was created in JS");

                callObj.onCallStatusChanged = function (status) {

                    console.log(Weemo.CallStatus)
                    console.log("CALL STATUS that was passed IS: " + status);
                    console.log("CALL STATUS that was getted IS: " + callObj.getCallStatus());
                    //if(callObj.getCallStatus() == Weemo.CallStatus.RINGING) {

                    //Let the rest of the app screens know that the call status has changed.
                    //This is so that the other screens/scopes won't have to check status every 500ms
                    angular.element(document.querySelector('#pageContainer')).scope().$broadcast('callchange',status);

                    if(callObj.getCallStatus() == "RINGING") {
                        console.log("Resuming call");
                        service._call.status = service.CallStatus.RINGING;
                    }
                    if(callObj.getCallStatus() == "PROCEEDING") {
                        console.log("Waiting on call recipient");
                        service._call.status = service.CallStatus.WAITING_ON_RECIPIENT;
                    }
                    if(callObj.getCallStatus() == "ACTIVE") {
                        service._call.status = service.CallStatus.ACTIVE;
                        console.log("Displaying call view");

                        //mark begin timestamp of call
                        beginCallTimestamp = (new Date).getTime();

                        //user cannot come back from call window
                        callObj.displayCallWindow(false, null);
                    }
                    if(callObj.getCallStatus() == "ENDED") {
                        console.log("Ending call");
                        service._call.status = service.CallStatus.ENDED;

                    }
                };

            };
        },
        CallStatus: {
            WAITING: 0,
            RINGING: 1,
            WAITING_ON_RECIPIENT: 2,
            ACTIVE: 3,
            ENDED: 4,
            NONE: 5
        }
    };
    return service;
}]);
