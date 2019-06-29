angular.module('synsormed.services.authentication', [
    'synsormed.services.error',
    'synsormed.env',
    'synsormed.services.oauth',
    'synsormed.services.healthkit',
    'synsormed.services.util'
])
    .service('synsormed.services.authentication.Login', [
        'localStorageService',
        '$http',
        '$q',
        'synsormed.services.error.http',
        'localStorageService',
        'synsormed.env.urlBase',
        '$rootScope',
        'synsormed.services.user.UserModel',
        'synsormed.services.logging.time',
        'synsormed.services.user.UserService',
        'synsormed.services.oauth.OauthService',
        'synsormed.services.healthkit.HealthkitService',
        'synsormed.services.oauth.OauthDataManagementService',
        'synsormed.services.util.httpretryservice',
        function (localStorageService, $http, $q, HttpError, localStorageService, urlBase, $rootScope, UserModel, TimeLogger, UserService, OauthService, HealthkitService, OauthDataManagementService, httpRetryService) {
            if(localStorageService.get('setEnv')){
              urlBase.env = localStorageService.get('setEnv')
            }
            //read various services and check if any data available to transmit for provider
            var getAvailableData = function(){
                var deferred = $q.defer();

                //var connectedService = OauthService.getStoredService();
                var connectedService = OauthService.getDefaultConnectedService();
                var callParams = {};

                if(!_.isEmpty(connectedService)){
                    callParams.service = connectedService.name;
                    callParams.data = connectedService.data;
                    deferred.resolve(callParams);

                }
                else {
                    //get if health data is available
                    HealthkitService
                    .checkAuth(null,function(result){
                        //if permissions are granted read the data
                        if(result === true) {
                            HealthkitService.readData()
                            .then(function(data){
                                callParams.service = 'healthkit';
                                callParams.data = data;
                                deferred.resolve(callParams);
                            })
                            .catch(function(err){
                                deferred.reject(err);
                            });
                        }
                        else{
                            deferred.resolve(callParams);
                        }

                    },function(err){
                        deferred.reject(err);
                    });
                }

                return deferred.promise;
            };

            return {
                getAvailableData: getAvailableData,
                //method will perform the patient auth with server
                patientAuth : function(code, device){
                  var callParams = { code : code, device: device };
                  //var counter = 0;
                  var deferred = $q.defer();

                  httpRetryService(urlBase.env + '/v1/authenticate/encounter','POST',callParams)
                    .then(function (resp) {
                      if(resp.data.csrfToken) {
                          localStorageService.set('x-csrf', resp.data.csrfToken);
                          $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                      }
                      localStorageService.set('X-Session-Token', resp.headers('X-Session-Token'));
                      $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                      deferred.resolve(new UserModel(resp.data));
                    })
                    .catch(function(e){
                        console.log("*** Error with patientAuth: " + JSON.stringify(e));
                        deferred.reject(e);
                    })
                  // var doQuery = function(){
                  //   console.log('URL is ' + urlBase + '/v1/authenticate/encounter');
                  //   $http.post(urlBase.env + '/v1/authenticate/encounter', callParams , {timeout: 10000})
                  //   .then(function (resp) {
                  //     console.log('Response in patientAuth: ' + JSON.stringify(resp));
                  //     if(resp.data.csrfToken) {
                  //         localStorageService.set('x-csrf', resp.data.csrfToken);
                  //         $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                  //     }
                  //     localStorageService.set('X-Session-Token', resp.headers('X-Session-Token'));
                  //     $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                  //     deferred.resolve(new UserModel(resp.data));
                  //   })
                  //   .catch(function (err) {
                  //     setTimeout(function(){ //Wait for completing the other webservices if there is
                  //       console.log('*****err in patient auth');
                  //       console.log(JSON.stringify(err));
                  //       var alreadyLoggedInUser = UserService.getUser();
                  //       console.log('******Check already logged in user ************');
                  //       console.log(alreadyLoggedInUser);
                  //       console.log(JSON.stringify(alreadyLoggedInUser));
                  //       console.log('************checked*********');
                  //       if(alreadyLoggedInUser){
                  //         return  deferred.resolve(alreadyLoggedInUser);
                  //       }
                  //       if(err.status == 0 && counter < 3){
                  //             counter ++;
                  //             console.log("*** Issue with patientAuth so retrying: " + counter);
                  //             doQuery();
                  //       }else{
                  //             console.log("*** There was an error with patientAuth: " + JSON.stringify(err));
                  //             deferred.reject(new HttpError({
                  //               code: err.status,
                  //               message: err.data
                  //             }));
                  //       }
                  //     }, 10);
                  //   });
                  // }
                  // doQuery();
                  return deferred.promise;
                },

                providerAuth: function (email, password, device) {
                    var deferred = $q.defer();
                    $http.post(urlBase.env + '/v1/authenticate', {
                        username: email,
                        password: password,
                        device: device
                    }, {timeout: 5000}).then(function (resp) {

                        if(resp.data.user.role == 'Provider')
                        {
                            if(resp.data.csrfToken) {
                                localStorageService.set('x-csrf', resp.data.csrfToken);
                                $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                            }
                            localStorageService.set('X-Session-Token', resp.headers('X-Session-Token'));
                            $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                            deferred.resolve(new UserModel(resp.data.user));
                        }
                        else {
                            deferred.reject(new Error('Provider account is required to use this section'));
                        }
                    }).catch(function (err) {
                        deferred.reject(new HttpError({
                            code: err.status,
                            message: err.data
                        }));
                    });
                    return deferred.promise;
                }
            };
        }
    ]);
