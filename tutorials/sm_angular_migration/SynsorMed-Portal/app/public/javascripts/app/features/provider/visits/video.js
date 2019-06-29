"use strict";
angular.module('synsormed.features.provider.visits.video', [
    'synsormed.services.worklist',
    'synsormed.services.quickBlox',
    'synsormed.services.timer'
])
.controller('VideoController', [
    '$scope',
    '$rootScope',
    'synsormed.services.WorklistService',
    'synsormed.services.QuickBlox',
    'encounterId',
    'providerId',
    '$modalInstance',
    'isBrowserSupported',
    '$timeout',
    'synsormed.services.TimerService',
    function($scope, $rootScope, WorklistService, QuickBlox, encounterId, providerId, $modalInstance, isBrowserSupported, $timeout, TimerService){
        var startDate;
        if(!isBrowserSupported){
            $scope.$emit('notification', {
                type: 'warning',
                message: 'We recommend Chrome for video consults'
            });
        }

        var currentSession = null, calleeId = null, quickBloxProvider = null;

        $scope.encounterId = encounterId;

        var onStartCall = function(){
            $scope.controls.start = false;
            $scope.controls.dial = true;
        };

        var refreshAngular = function(){
            $timeout(function(){
                  $scope.$apply();
            },0);
        };

        var onConnectCall = function(){
            $rootScope.isCallStarted = true;
            $scope.controls.start = false;
            $scope.controls.dial = false;
            $scope.showBackground = true;
        };

        var onStopCall = function(){
            $rootScope.isCallStarted = false;
            $scope.controls.start = true;
            $scope.showBackground = false;
            currentSession = null;
            $scope.$emit('notification', {
                type: 'danger',
                message: 'Call is disconnected'
            });
            $scope.close();
        };

        $scope.controls = {
            start: true, audio: true, video: true, dial: false
        };

        $scope.$emit('wait:start');
        WorklistService.getQuickBloxDetails(providerId)
        .then(function(details){
             quickBloxProvider = details;
             return WorklistService.getEncounterQuickBoxDetails(encounterId);
        })
        .then(function(calleeDetails){
            calleeId = calleeDetails.id;
            QuickBlox.initialize(quickBloxProvider.token);
            QB.webrtc.onCallListener = function(session, extension) {
                currentSession = session;
                QuickBlox.getUserMedia(session)
                .then(function(stream){
                    session.attachMediaStream('localVideo', stream);
                    session.accept(extension);
                })
                .catch(function(err){
                    currentSession = null;
                    if(err.code==404){
                        var device = err.device;
                        $scope.$emit('notification', {
                            type: 'danger',
                            message: device + ' device not found.'
                        });
                    }
                    console.log(err);
                });
            };

            QB.webrtc.onRemoteStreamListener = function(session, userID, remoteStream) {
                session.attachMediaStream('remoteVideo', remoteStream);
            };

            QB.webrtc.onAcceptCallListener = function(session, userId, extension){
                startDate = extension.startDate ? moment(extension.startDate) : moment();
                $rootScope.isCallStarted = true;
            };

            QB.webrtc.onUserNotAnswerListener = function(session, userId){
                $scope.$emit('notification', {
                    type: 'danger',
                    message: 'No response from user'
                });
                refreshAngular();
            };

            QB.webrtc.onRejectCallListener = function(session, userId, extension) {
                $scope.$emit('notification', {
                    type: 'danger',
                    message: 'Call is rejected'
                });
                refreshAngular();
            };

            QB.webrtc.onStopCallListener = function(session, userId, extension) {
                onStopCall();
                refreshAngular();
            };

            QB.webrtc.onSessionConnectionStateChangedListener = function(session, userID, connectionState) {
                switch (connectionState) {
                    case 0:
                    console.log('Undefined Error');
                    break;
                    case 1:
                    console.log('Connecting Please wait');
                    break;
                    case 2:
                    onConnectCall();
                    console.log('Call is connected');
                    break;
                    case 3:
                    case 4:
                    case 5:
                    onStopCall();
                    console.log('Call is closed');
                    break;
                    case 6:
                    console.log('Call is completed');
                    break;
                }
                refreshAngular();
            };

            return QuickBlox.connectUser(quickBloxProvider.id, quickBloxProvider.password);
        })
        .then(function(res){
            $scope.$emit('wait:stop');
            $scope.startCall2();
        })
        .catch(function(err){
            console.log(err);
            $scope.$emit('wait:stop');
            if(err.status == 404) {
                console.log('callee Not found');
                $scope.disableBtn = true;
            }
            $scope.$emit('notification', {
                type: 'danger',
                message: 'Server Error'
            });
        });

        //This is the old way startCall used to work. Keeping for reference AH 022719
        $scope.startCall = function(){
            var arryCall = [calleeId];
            currentSession = QuickBlox.createSession(arryCall);
            QuickBlox.getUserMedia(currentSession)
            .then(function(stream){
                onStartCall();
                currentSession.attachMediaStream('localVideo', stream);
                QuickBlox.startCall(currentSession);
            })
            .catch(function(err){
                currentSession.stop(calleeId, {});
                if(err.code==404){
                    var device = err.device;
                    $scope.$emit('notification', {
                        type: 'danger',
                        message: err.message
                    });
                }
                console.log(err);
            });
        };

        $scope.startCall2 = function(){
            var arryCall = [calleeId];
            var sessionType = QB.webrtc.CallType.VIDEO;
            currentSession = QB.webrtc.createNewSession(arryCall, sessionType);
            var mediaParams = {
                audio: true,
                video: true
            };
            currentSession.getUserMedia(mediaParams, function(err, stream){
                if(err){
                    currentSession.stop(calleeId, {});
                    if(err.code==404){
                        var device = err.device;
                        $scope.$emit('notification', {
                            type: 'danger',
                            message: err.message
                        });
                    }
                    console.log("*** Video issue getting userMedia: " + err);
                }else{
                    onStartCall();
                    currentSession.attachMediaStream('localVideo', stream);
                    QuickBlox.startCall(currentSession);
                }
            });
        };

        $scope.endCall = function(){
            if(!currentSession) return ;
            currentSession.stop(calleeId, {});
            if(!$rootScope.isCallStarted) {
                currentSession.update({disconnected: true});
            }
            onStopCall();
        };

        $scope.toggleType = function(type){
            if(!currentSession) return;
            if($scope.controls[type]){
                currentSession.mute(type);
                $scope.controls[type] = false;
            }
            else{
                currentSession.unmute(type);
                $scope.controls[type] = true;
            }
        };

        $scope.close = function(){
             if(currentSession) {
                 currentSession.stop(calleeId, {});
                 currentSession = null;
             }
             if($rootScope.videoModelOpened)$modalInstance.dismiss();
        };

        $scope.$watch('isCallStarted', function(val){
            if(val){
                $scope.$emit('web:chat:started'); //notify if call is in progress
                TimerService.startTimer(function(duration){
                    $scope.duration = duration;
                }, startDate);
            }
            else{
                $scope.$emit('web:chat:stopped');
                TimerService.cancelTimer();
            }
        });

        $scope.$on('$destroy', function() {
            $scope.endCall();
        });
    }
]);
