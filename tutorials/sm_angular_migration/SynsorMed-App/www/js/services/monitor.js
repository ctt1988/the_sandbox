angular.module('synsormed.services.monitor', [
    'LocalStorageModule',
    'synsormed.services.util'
    ])
.service('synsormed.services.monitor.MonitorMeasurementService',[
    'localStorageService',
    '$http',
    '$q',
    'synsormed.env.urlBase',
    'synsormed.services.util.httpretryservice',
    function(localStorageService, $http, $q, urlBase, httpRetryService){
        if(localStorageService.get('setEnv')){
          urlBase.env = localStorageService.get('setEnv')
        }
        return {
            getMonitors : function(providerId)
            {
                var deferred = $q.defer();
                //$http.get(urlBase.env + '/v1/rest/provider/' + providerId + '/monitor')
                httpRetryService(urlBase.env + '/v1/rest/provider/' + providerId + '/monitor','GET')
                .then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            getMeasurementsForMonitor : function(id){
                // var counter = 0;
                // var maxTries = 10;
                var deferred = $q.defer();

                httpRetryService(urlBase.env + '/v1/rest/monitor/' + id + '/measurements', 'GET')
                .then(function(resp){
                    deferred.resolve(resp.data);
                })
                .catch(function(e){
                    deferred.reject(e);
                });

                // function doQuery(){
                //     $http.get(urlBase.env + '/v1/rest/monitor/' + id + '/measurements',{timeout:5000})
                //     .then(function (resp) {
                //     deferred.resolve(resp.data);
                //     })
                //     .catch(function(e){
                //         if(counter < maxTries){
                //             counter ++;
                //             setTimeout(function(){
                //                 console.log("*** getMeasurementsForMonitor failed, so trying again: " + counter + " The error is: " + JSON.stringify(e));
                //                 doQuery();
                //             },1000);
                //         }else{
                //             deferred.reject(e);
                //         }

                //     });
                // }

                // doQuery();

                return deferred.promise;
            },
            setOauthDataForMeasurement : function(monitorId,monitorMeasurementId,data,oauthUpdateOnly){
                var deferred = $q.defer();
                oauthUpdateOnly = oauthUpdateOnly || false;
                //$http.put(urlBase.env + '/v1/rest/monitor/' + monitorId + '/measurements/' + monitorMeasurementId + '?oauthUpdateOnly=' + oauthUpdateOnly, data, {timeout:15000})
                httpRetryService(urlBase.env + '/v1/rest/monitor/' + monitorId + '/measurements/' + monitorMeasurementId + '?oauthUpdateOnly=' + oauthUpdateOnly,'PUT',data)
                .then(function (resp) {
                    deferred.resolve(true);
                }).catch(deferred.reject);
                return deferred.promise;
            },
            saveNotifyStatus: function (monitorId, notifyRequested) {
                var deferred = $q.defer();
                $http.put(urlBase.env + '/v1/rest/monitor/' + monitorId, {
                    notifyRequested: notifyRequested
                }).then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(function (err) {
                    deferred.reject(new HttpError({
                        code: err.status,
                        message: err.data
                    }));
                });
                return deferred.promise;
            },
            fetchData: function(monitorId, monitorMeasurementId, days){
                var days = days ? days :'';
                var deferred = $q.defer();
                $http.get(urlBase.env + '/v1/rest/monitor/' + monitorId + '/measurements/' + monitorMeasurementId + '/insights',{
                    params:{
                        days:days
                    }
                  })
                .then(function (resp) {
                    deferred.resolve(resp.data);
                }).catch(deferred.reject);
                return deferred.promise;
            }
        };
    }])
    .service('synsormed.services.monitor.MonitorServicesService',[
        'localStorageService',
        '$http',
        '$q',
        'synsormed.env.urlBase',
        'synsormed.services.util.httpretryservice',
        function(localStorageService, $http, $q, urlBase, httpRetryService){
          if(localStorageService.get('setEnv')){
            urlBase.env = localStorageService.get('setEnv')
          }
            return {
                getServicesForMonitor : function(id, measurementId){
                    var deferred = $q.defer();
                    //$http.get(urlBase.env + '/v1/rest/monitor/' + id + '/services?measurementId=' + measurementId, {timeout: 5000})
                    httpRetryService(urlBase.env + '/v1/rest/monitor/' + id + '/services?measurementId=' + measurementId, 'GET')
                    .then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },
                getServicesInfo: function(monitorId, services){
                    var deferred = $q.defer();
                    $http.get(urlBase.env + '/v1/rest/monitor/' + monitorId + '/services/info?services='+services, {timeout: 10000}).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },
                getConnectedService: function(monitorId){
                    var deferred = $q.defer();
                    //$http.get(urlBase.env + '/v1/rest/monitor/' + monitorId + '/services/connected', {timeout: 10000})
                    httpRetryService(urlBase.env + '/v1/rest/monitor/' + monitorId + '/services/connected', 'GET')
                    .then(function (resp) {
                        deferred.resolve(resp.data);
                    })
                    .catch(function(e){
                        console.log("*** There was an error with getConnectedService: " + JSON.stringify(e));
                        deferred.reject(e);
                    });
                    return deferred.promise;
                },
                unlinkOauthToken: function(monitorId, oauthId){
                    var deferred = $q.defer();
                    $http.delete(urlBase.env + '/v1//rest/monitor/' + monitorId + '/token/' + oauthId).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                }
            };
        }])
        .service('synsormed.services.monitor.MonitorAppointmentService',[
            '$http',
            '$q',
            'synsormed.env.urlBase',
            function($http, $q, urlBase){
                return {
                    setAppointment : function(monitorId,date){
                        var deferred = $q.defer();
                        $http.post(urlBase.env + '/v1/rest/monitor/' + monitorId + '/appointment/confirm', { date : date }, {timeout:15000}).then(function (resp) {
                            deferred.resolve(resp.data);
                        }).catch(deferred.reject);
                        return deferred.promise;
                    }
                }
            }
        ])
        .service('synsormed.services.monitor.MonitorDocumentService',[
            '$http',
            '$q',
            'synsormed.env.urlBase',
            'localStorageService',
            function($http, $q, urlBase, localStorageService){
                return {
                    educationAvailable: function(){
                        var deferred = $q.defer();
                        $http.get(urlBase.env + '/v1/rest/diseases/available', {timeout:10000}).then(function (resp) {
                            deferred.resolve(resp.data);
                        }).catch(deferred.reject);
                        return deferred.promise;
                    },
                    getDocuments : function(monitorId){
                        var deferred = $q.defer();
                        $http.get(urlBase.env + '/v1/rest/monitor/'+ monitorId +'/documents/', {timeout:15000})
                        .then(function(resp){
                            deferred.resolve(resp.data);
                        }).catch(deferred.reject);
                        return deferred.promise;
                    },
                    getToken : function(monitorId, file, diseasesId){
                        var deferred = $q.defer();
                        $http.get(urlBase.env + '/v1/file/token?monitorId='+monitorId+'&fileName='+file+'&diseasesId='+diseasesId, {timeout:15000})
                        .then(function(resp){
                            deferred.resolve(resp.data);
                        }).catch(deferred.reject);
                        return deferred.promise;
                    },
                    getFile : function(token, fileName){
                        var deferred = $q.defer();
                        if(!token || !fileName) return defer.reject('No token found');
                        handleDocumentWithURL(
                            function() {
                                deferred.resolve(true);
                                console.log('success');
                            },
                            function(error) {
                                deferred.reject(error);
                            },
                            encodeURI(urlBase.env + '/v1/file/'+token+'/'+fileName)
                        );
                        return deferred.promise;
                    },
                    markRead : function(monitorId, diseasesId, filename){
                        var deferred = $q.defer();
                        $http.put(urlBase.env + '/v1/rest/monitor/'+ monitorId +'/documents/', {diseasesId: diseasesId, fileName: filename }, {timeout:15000})
                        .then(function(resp){
                            deferred.resolve(resp.data);
                        }).catch(deferred.reject);
                        return deferred.promise;
                    }
                }
            }
        ])
        .service('synsormed.services.monitor.MonitorLeaderboardService',[
            '$q',
            '$http',
            'synsormed.env.urlBase',
            function($q, $http, urlBase){
                return {
                   getEnrolledMonitors: function(monitorId){
                       var deferred = $q.defer();
                       $http.get(urlBase.env + '/v1/rest/monitor/'+ monitorId +'/leaderboard/', {timeout:15000})
                       .then(function(resp){
                           deferred.resolve(resp.data);
                       })
                       .catch(deferred.reject);
                       return deferred.promise;
                   }
                };
            }
        ])
