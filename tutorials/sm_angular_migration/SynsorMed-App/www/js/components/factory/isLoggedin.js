angular.module('synsormed.services.isLoggedin', [])
.factory('synsormed.factory.user.loggedin', [
    'synsormed.services.authentication.Login',
    '$location',
    '$modal',
    'synsormed.services.oauth.OauthDataManagementService',
    'localStorageService',
    'synsormed.services.pushNotification.pushNotificationService',
    'synsormed.services.touchId.TouchIdService',
    'synsormed.services.touchId.TouchIdStorage',
    'synsormed.services.monitor.MonitorMeasurementService',
    function (LoginService, $location, $modal, OauthDataManagementService, localStorageService, pushNotificationService, TouchIdService, TouchIdStorage, MonitorMeasurementService){
      return {
          attemptLogin: function(code, rememberMe, scope){
              var auth = this;
              //scope.$emit('wait:start')
              var registrationId = pushNotificationService.getRegistrationId();
              var information = {
                  registrationId: registrationId,
                  platform: device.platform,
                  device_id: device.uuid
              };
              return LoginService.patientAuth(code, information)
              .then(function (user) {
                  //scope.$emit('wait:stop')
                  auth.authIfTouchAvailable(true, scope); //associate patient
                  if(rememberMe){
                      localStorageService.set('synsormed:patient:code', code);
                  } else {
                      localStorageService.remove('synsormed:patient:code');
                  }
                  user.save(true); //Saving locally, skipping remote save
                  localStorageService.set('user-loggedin',JSON.stringify({
                      loggedCsrf    : localStorageService.get('x-csrf'),
                      loggedSession : localStorageService.get('X-Session-Token'),
                      loggedUser    : user
                  }));
                  if(user.isMonitor){ //check if user is monitor type
                      if(!user.termsAccepted) { //if terms not accepted show them this screen
                          return $location.path('/monitor/terms');
                      }
                      else if (user.appointmentMeta) {
                          return $location.path('/monitor/appointment');
                      }
                      else{
                          var oxyData = false;
                          var weightData = false;
                          var statusData = false;
                          var setupNeeded = false;
                          var availMeasurements = [];
                          var surveyMeasurement = {};
                          var compatibleBLE = ['oxygen saturation', 'weight', 'temperature'];
                          MonitorMeasurementService.getMeasurementsForMonitor(user.id)
                          .then(function(measurements){
                            _.forEach(measurements, function(measurement){
                              availMeasurements.push(measurement.name);
                              //Check to see if any of the compatible BLE measurements have not been linked to a service yet
                              if(measurement && compatibleBLE.includes(measurement.name.toLowerCase())){
                                if(!measurement.serviceName){
                                  setupNeeded = true;
                                }
                              }
                              // else if(measurement && measurement.name.toLowerCase() == 'status'){
                              //   statusData = true;
                              //   surveyMeasurement = measurement;
                              // } 
                              // else if(measurement && measurement.name.toLowerCase() == 'weight' && measurement.serviceName){
                              //   weightData = true;
                              // }
                            })
                            if(setupNeeded){
                              return $location.path('/monitor/read');
                            }else{
                              return $location.path('/monitor/guide');
                            }
                            // if(availMeasurements && availMeasurements.length == 1 && availMeasurements.indexOf('Oxygen saturation') != -1){
                            //   return $location.path('/monitor/read');
                            // }
                            // else if(availMeasurements && availMeasurements.length == 1 && availMeasurements.indexOf('Status') != -1){
                            //   //return $location.path('/monitor/survey/step');
                            //   //return $location.path('/monitor/guide/' + user.id + '/' + surveyMeasurement.id);
                            //   $location.path('/monitor/guide');
                            // }
                            // else if(oxyData && statusData){
                            //   //return $location.path('/monitor/survey/step');
                            //   //return $location.path('/monitor/guide/' + user.id + '/' + surveyMeasurement.id);
                            //   $location.path('/monitor/guide');
                            // }
                            // else if(!oxyData && statusData){
                            //   return $location.path('/monitor/read');
                            // }
                            // else{
                            //   return $location.path('/monitor/read');
                            // }
                          })
                      }
                  }
                  else {
                      if(!user.termsAccepted) {  //Has the user already agreed to the TOU?
                          return $location.path('/patient/terms');
                      }
                      else if(!user.paid && user.fee > 0) {
                          return $location.path('/patient/pay');
                      }
                      else {
                          return $location.path('/patient/call');
                      }
                  }
              });

          },
          authIfTouchAvailable: function(association, scope){
              var login = this;
              var isAvailable = TouchIdService.checkTochIdPlugin();
              if(!isAvailable) return false;
              TouchIdService.checkAvailable()
              .then(function(){
                  return TouchIdService.checkPatientKey();
              })
              .then(function(avail){
                  if(avail && !association){
                      var prevCount = TouchIdStorage.getCancelCount() || 0;
                      if(prevCount >= 3) return;
                      return TouchIdService.verifyPatient('Please scan your fingerprint to login.')
                      .then(function(password){
                          var code = password;
                          login.attemptLogin(code);
                      });
                  }
                  else if(association && !avail){
                      var prevAns = TouchIdStorage.getAssociationForKey(code);
                      if(prevAns == undefined){
                          var modalInstance = $modal.open({
                              templateUrl: 'js/features/login/confirm/confirm.html',
                              controller: 'confirmTouchIdAssociation',
                              backdrop: 'static'
                          });

                          return modalInstance.result //reload the monitor list
                          .then(function(associate){
                              if(associate){
                                  return TouchIdService.savePatient(code)
                                  .then(function(){
                                     scope.$emit('notification:success', 'Successfully associated');
                                  })
                                  .catch(function(){
                                     scope.$emit('notification:error', 'Login association failed');
                                  });
                              }
                              TouchIdStorage.setAssociation(code, !!associate);
                          })
                          .catch(function(err){
                             console.log(err);
                          });
                      }
                      return true;
                  }
              })
              .catch(function(err){
                 console.log(JSON.stringify(err));
                 if(err == -1){
                     scope.$emit('notification:error', 'Fingerprint scan failed more than 3 times');
                 }
                 if(err == -2 || err == -128){
                     var prevCount = TouchIdStorage.getCancelCount() || 0;
                     TouchIdStorage.setCancelCount(parseInt(prevCount) + 1);
                 }
                 if(err == -8){
                    scope.$emit('notification:error', 'TouchID is locked out from too many tries');
                 }
              });
          },
          startAuth: function(email, password, scope){

              var auth = this;
              //scope.$emit('wait:start')
              return LoginService.providerAuth(email, password)
              .then(function (user) {
                  //scope.$emit('wait:stop')
                  auth.providerAuthIfTouchAvailable(true, scope);
                  console.log(user);
                  user.save(true);

                  localStorageService.set('logginProvider',JSON.stringify({
                      loggedEmail    : user.email,
                      loggedSession : localStorageService.get('X-Session-Token'),
                      loggedUser    : user
                  }));
                  if(user.email){
                      //scope.$emit('wait:stop')
                      return $location.path('/provider/list');
                  }else{
                      scope.$emit('wait:stop')
                  }
              })
          },
          providerAuthIfTouchAvailable: function(association, scope){
              var isAvailable = TouchIdService.checkTochIdPlugin();
              if(!isAvailable) return false;
              TouchIdService.checkAvailable()
              .then(function(){
                  return TouchIdService.checkProviderKey();
              })
              .then(function(avail){
                  if(avail && !association){
                      var prevCount = TouchIdStorage.getCancelCount() || 0;
                      if(prevCount >= 3) return;
                      return TouchIdService.verifyProvider('Please scan your fingerprint to login.')
                      .then(function(cred){
                          cred = JSON.parse(cred);
                          $scope.email = cred.email;
                          $scope.password = cred.password;
                          LoggedInUser.startAuth($scope.email, $scope.password, $scope);
                      });
                  }
                  else if(association && !avail){
                      var prevAns = TouchIdStorage.getAssociationForKey(localStorageService.get('savedUsername'));
                      if(prevAns == undefined){
                          var modalInstance = $modal.open({
                              templateUrl: 'js/features/login/confirm/confirm.html',
                              controller: 'confirmTouchIdAssociation',
                              backdrop: 'static'
                          });

                          return modalInstance.result //reload the monitor list
                          .then(function(associate){
                              if(associate){
                                  var cred = JSON.stringify({
                                      email: localStorageService.get('savedUsername'),
                                      password: localStorageService.get('savedPassword')
                                  });
                                  return TouchIdService.saveProvider(cred)
                                  .then(function(){
                                      scope.$emit('notification:success', 'Successfully associated');
                                  })
                                  .catch(function(){
                                      scope.$emit('notification:error', 'Login association failed');
                                  });
                              }
                              TouchIdStorage.setAssociation($scope.code, !!associate);
                          })
                          .catch(function(err){
                             console.log(err);
                          });
                      }
                      return true;
                  }
              })
              .catch(function(err){
                  console.log(JSON.stringify(err));
                  if(err == -1){
                      scope.$emit('notification:error', 'Fingerprint scan failed more than 3 times');
                  }
                  if(err == -2 || err == -128){
                      var prevCount = TouchIdStorage.getCancelCount() || 0;
                      TouchIdStorage.setCancelCount(parseInt(prevCount) + 1);
                  }
                  if(err == -8){
                      scope.$emit('notification:error', 'TouchID is locked out from too many tries');
                  }
              });
          }
      }
  }
]);
