"use strict";

angular.module('synsormed.features.patient.call',[
    'synsormed.services.user',
    'synsormed.services.worklist',
    'synsormed.services.encounter',
    'synsormed.services.quickBlox',
    'synsormed.services.timer'
])
.controller('PatientCallController',[
    '$scope',
    '$modal',
    '$timeout',
    '$interval',
    '$rootScope',
    'isBrowserSupported',
    'synsormed.services.QuickBlox',
    'synsormed.services.UserService',
    'synsormed.services.WorklistService',
    'synsormed.services.EncounterService',
    function($scope, $modal, $timeout, $interval, $rootScope, isBrowserSupported, QuickBlox, UserService, WorklistService, EncounterService){
        var patient =  UserService.fetchCachedUser();
        $scope.patientCode = patient.code;
        var currentSession = null, currentExtention = null, calleeId = null, quickBloxPatient = null, popupInstance;

        if(!isBrowserSupported){
            $scope.$emit('notification', {
                type: 'warning',
                message: 'We recommend Chrome for video consults'
            });
        }

        var refreshAngular = function(){
            $timeout(function(){
                  $scope.$apply();
            },0);
        };

        var closePopUp = function(){
            if(currentSession || $scope.currentSession) {
                currentSession = $scope.currentSession;
                currentSession.reject(calleeId, {});
                currentSession.stop(calleeId, {});
                currentSession = null;
                currentExtention = null;
            }
            if($scope.videoModelOpened) popupInstance.dismiss();
        };

        var onStopCall = function(){
            $rootScope.showBackground = false;
            if($rootScope.callStarted){
                $scope.$emit('notification', {
                    type: 'danger',
                    message: 'Call is disconnected'
                });
            }
            currentSession = null;
            currentExtention = null;
            closePopUp();
        };

        var onConnectCall = function(){
            $rootScope.showBackground = true;
        };


       $scope.$emit('wait:start');
        WorklistService.getEncounterQuickBoxDetails(patient.id)
        .then(function(details){
             quickBloxPatient = details;
             return WorklistService.getQuickBloxDetails(patient.providerId);
         })
         .then(function(calleeDetails){
            calleeId = calleeDetails.id;
            QuickBlox.initialize(quickBloxPatient.token);
            return QuickBlox.connectUser(quickBloxPatient.id, quickBloxPatient.password);
        })
        .then(function(res){
            QB.webrtc.onCallListener = function(session, extension) {
                $scope.currentSession = currentSession = session;
                currentExtention = extension;
                openPopup();
                refreshAngular();
            };

            QB.webrtc.onRemoteStreamListener = function(session, userID, remoteStream) {
                session.attachMediaStream('remoteVideo', remoteStream);
                refreshAngular();
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

            QB.webrtc.onUpdateCallListener = function(session, userId, extension) {
                 var isDisconnected = extension.disconnected;
                 if(isDisconnected) {
                     $scope.$emit('notification', {
                         type: 'danger',
                         message: 'Call is disconnected'
                     });
                     onStopCall();
                     refreshAngular();
                 }
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
                      $rootScope.callStarted = false;
                    onStopCall();
                    console.log('Call is closed');
                    break;
                    case 6:
                    console.log('Call is completed');
                    break;
                }
                refreshAngular();
            };
            $scope.$emit('wait:stop');
        })
        .catch(function(err){
            $scope.$emit('wait:stop');
            console.log('err', err);
        });


        var updateStatus = function(){
            EncounterService.pingServer(patient.code);
            return EncounterService.getProviderStatus(patient.providerId)
            .then(function(result){
                $rootScope.isProviderOnline = result.online;
            })
            .catch(function(err){
                $rootScope.isProviderOnline = false;
            });
        };

        updateStatus();

        var statusInterval = $interval(function(){
              updateStatus();
        }, 30000);

        var rejectCall = function(){
            if(currentSession) currentSession.reject(currentExtention);
            onStopCall();
        };

        var openPopup = function(){
            if($scope.videoModelOpened) return;

            popupInstance = $modal.open({
                backdrop: false,
                templateUrl: 'javascripts/app/features/patient/encounter/video.html',
                controller: 'VideoPatientController',
                windowClass: 'custom-video-modal',
                resolve:{
                    patient: function(){
                       return patient;
                    },
                    currentSession: function(){
                        return currentSession;
                    },
                    currentExtention: function(){
                        return currentExtention;
                    },
                    calleeId: function(){
                        return calleeId;
                    },
                    closePopUp: function(){
                        return closePopUp;
                    },
                    onStopCall: function(){
                        return onStopCall;
                    },
                    rejectCall: function(){
                        return rejectCall;
                    }
                }
            });

            popupInstance.opened.then(function () {
                $scope.videoModelOpened = true;
            });

            popupInstance.result.then(function (selectedItem) {
                $scope.videoModelOpened = false;
            }, function () {
                $scope.videoModelOpened = false;
            });
        };

        $scope.$on('$destroy', function() {
            onStopCall();
            $interval.cancel(statusInterval);
        });
    }
])
.controller('VideoPatientController', [
  '$scope',
  '$rootScope',
  '$interval',
  'patient',
  'calleeId',
  'rejectCall',
  'onStopCall',
  'closePopUp',
  '$modalInstance',
  'currentSession',
  'currentExtention',
  'synsormed.services.QuickBlox',
  'synsormed.services.EncounterService',
  'synsormed.services.TimerService',
  function($scope, $rootScope, $interval, patient, calleeId, rejectCall, onStopCall, closePopUp, $modalInstance, currentSession, currentExtention, QuickBlox, EncounterService, TimerService){
      var startDate
      $rootScope.callStarted = false;

      $scope.acceptCall = function(){
          if(currentSession && currentExtention){
              $scope.$emit('wait:start');
              QuickBlox.getUserMedia(currentSession)
              .then(function(stream){
                  $scope.$emit('wait:stop');
                  currentSession.attachMediaStream('localVideo', stream);
                  startDate = moment();
                  $rootScope.callStarted = true;
                  console.log('startDate', startDate.format());
                  currentSession.accept({startDate: startDate});
              })
              .catch(function(err){
                  $rootScope.callStarted = false;
                  $scope.$emit('wait:stop');
                  currentSession = null;
                  currentExtention = null;
                  if(err.code==404){
                      var device = err.device;
                      $scope.$emit('notification', {
                          type: 'danger',
                          message: device + ' device not found.'
                      });
                  }
                  else{
                      $scope.$emit('notification', {
                          type: 'danger',
                          message: 'Server error'
                      });
                  }
                  $scope.close();
              });
          }
          else{
              $scope.$emit('notification', {
                  type: 'danger',
                  message: 'Sesion is expired'
              });
          }
      };

      $scope.controls = { audio: true, video: true };

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

      $scope.rejectCall = function(){
          rejectCall();
      };

      $scope.endCall = function(){
          $rootScope.callStarted = false;
          onStopCall();
      };

      $scope.close = function(){
          closePopUp();
      };


      $scope.$watch('callStarted', function(val){
          if(val){
              $scope.$emit('web:chat:started'); //notify if call is in progress
              TimerService.startTimer(function(duration){
                  $scope.duration = duration;
              }, startDate);
          }
          else{
              $scope.$emit('web:chat:stopped');
              TimerService.cancelTimer(function(totalDurationInSeconds){
                  EncounterService.logEncounterCallDuration(patient.id, parseInt(totalDurationInSeconds));
                  $scope.duration = null;
              });
          }
      });

      $scope.$on('$destroy', function() {
          $rootScope.callStarted = false;
      });
  }

]);
