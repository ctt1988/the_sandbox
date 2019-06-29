'use strict';

angular.module('synsormed.services.location',[
        'synsormed.services.util'
    ])
.service('synsormed.services.location.locationService',[
    'localStorageService',
    '$http',
    '$q',
    'synsormed.env.urlBase',
    'synsormed.services.error.http',
    'synsormed.services.util.httpretryservice',
    function (localStorageService, $http, $q, urlBase, HttpError, httpRetryService) {
        if(localStorageService.get('setEnv')){
          urlBase.env = localStorageService.get('setEnv')
        }
        return {

            getLocation: function(){
                var defer = $q.defer();
                if(!navigator.geolocation) return defer.resolve(null);


                var getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, geoprogress, options) {
                    var lastCheckedPosition,
                        locationEventCount = 0,
                        watchID,
                        timerID;

                    options = options || {};

                    var checkLocation = function (position) {
                        console.log("*** Inside checkLocation for GPS");
                        lastCheckedPosition = position;
                        locationEventCount = locationEventCount + 1;
                        // We ignore the first event unless it's the only one received because some devices seem to send a cached
                        // location even when maxaimumAge is set to zero
                        if ((position.coords.accuracy <= options.desiredAccuracy) && (locationEventCount > 1)) {
                            clearTimeout(timerID);
                            navigator.geolocation.clearWatch(watchID);
                            console.log("*** Got a position: " + JSON.stringify(position));
                            foundPosition(position);
                        } else {
                            geoprogress(position);
                        }
                    };

                    var stopTrying = function () {
                        navigator.geolocation.clearWatch(watchID);
                        if(lastCheckedPosition){
                            foundPosition(lastCheckedPosition);
                        }else{
                            geolocationError("Stopped Trying due to error getting location via watch function");
                        }
                    };

                    var onError = function (error) {
                        clearTimeout(timerID);
                        navigator.geolocation.clearWatch(watchID);
                        geolocationError(error);
                    };

                    var foundPosition = function (position) {
                        geolocationSuccess(position);
                    };

                    if (!options.maxWait)            options.maxWait = 10000; // Default 10 seconds
                    if (!options.desiredAccuracy)    options.desiredAccuracy = 20; // Default 20 meters
                    if (!options.timeout)            options.timeout = options.maxWait; // Default to maxWait

                    options.maximumAge = 0; // Force current locations only
                    options.enableHighAccuracy = true; // Force high accuracy (otherwise, why are you using this function?)

                    watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
                    timerID = setTimeout(stopTrying, options.maxWait); // Set a timeout that will abandon the location loop
                };

                var locationSuccess = function(position){
                    var positionObject = {};

                    if ('coords' in position) {
                        positionObject.coords = {};
                        if('latitude' in position.coords){
                            console.log("**** The lat is:  " + position.coords.latitude);
                            positionObject.coords.latitude = position.coords.latitude;
                        }
                        if('longitude' in position.coords){
                            console.log("**** The longitude is:  " + position.coords.longitude);
                            positionObject.coords.longitude = position.coords.longitude;
                        }
                        if('accuracy' in position.coords){
                            console.log("***** The location accuracy is: " + position.coords.accuracy);
                            positionObject.coords.accuracy = position.coords.accuracy;
                        }
                        if('altitude' in position.coords){
                            positionObject.coords.altitude = position.coords.altitude;
                        }
                        if('altitudeAccuracy' in position.coords){
                            positionObject.coords.altitudeAccuracy = position.coords.altitudeAccuracy;
                        }
                        if('heading' in position.coords){
                            positionObject.coords.heading = position.coords.heading;
                        }
                        if('speed' in position.coords){
                            positionObject.coords.speed = position.coords.speed;
                        }
                    }

                    if ('timestamp' in position){
                        positionObject.timestamp = position.timestamp;
                    }

                    defer.resolve(positionObject);
                };

                var locationFail = function(error){
                    console.log("**** There was an error getting location: " + JSON.stringify(error));
                    defer.reject;
                };

                var locationProgress = function(position){
                    console.log("**** Making progress to get better location. Accuracy at: " + position.coords.accuracy);
                };

                getAccurateCurrentPosition(locationSuccess,locationFail,locationProgress, {desiredAccuracy:10, maxWait:15000});


                // navigator.geolocation.getCurrentPosition(function(position){
                //     var positionObject = {};

                //     if ('coords' in position) {
                //         positionObject.coords = {};
                //         if('latitude' in position.coords){
                //             console.log("**** The lat is:  " + position.coords.latitude);
                //             positionObject.coords.latitude = position.coords.latitude;
                //         }
                //         if('longitude' in position.coords){
                //             console.log("**** The longitude is:  " + position.coords.longitude);
                //             positionObject.coords.longitude = position.coords.longitude;
                //         }
                //         if('accuracy' in position.coords){
                //             console.log("***** The locatino accuracy is: " + position.coords.accuracy);
                //             positionObject.coords.accuracy = position.coords.accuracy;
                //         }
                //         if('altitude' in position.coords){
                //             positionObject.coords.altitude = position.coords.altitude;
                //         }
                //         if('altitudeAccuracy' in position.coords){
                //             positionObject.coords.altitudeAccuracy = position.coords.altitudeAccuracy;
                //         }
                //         if('heading' in position.coords){
                //             positionObject.coords.heading = position.coords.heading;
                //         }
                //         if('speed' in position.coords){
                //             positionObject.coords.speed = position.coords.speed;
                //         }
                //     }

                //     if ('timestamp' in position){
                //         positionObject.timestamp = position.timestamp;
                //     }

                //     defer.resolve(positionObject);
                // }, defer.reject, { enableHighAccuracy: true });
                return defer.promise;
            },
            updateLocation: function (object_id, object_type, object_data) {
                var params = {
                    object_id: object_id,
                    object_type: object_type,
                    object_data: object_data
                };
                //return $http.post(urlBase.env + '/v1/rest/location/', params, {timeout: 5000})
                return httpRetryService(urlBase.env + '/v1/rest/location/','POST',params)
                .then(function (resp) {
                    console.log("*** Successfully updated location ***");
                    return resp.data;
                })
                .catch(function (err) {
                    throw new HttpError({
                        code: err.status,
                        message: err.data
                    });
                });
            },
            updateMonitorLocation: function(object_id, object_data){
                return this.updateLocation(object_id, 'monitor', object_data);
            },
            updateEncounterLocation: function(object_id, object_data){
                return this.updateLocation(object_id, 'encounter', object_data)
            }
        };
    }
]);
