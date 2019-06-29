angular.module('synsormed.services.user', ['LocalStorageModule'])
.provider('synsormed.services.user.UserService', [function () {
    this.$get = [
        'localStorageService',
        '$http',
        '$q',
        'synsormed.services.user.UserModel',
        'synsormed.env.urlBase',
        'synsormed.services.error.http',
        function (localStorageService, $http, $q, UserModel, urlBase, HttpError) {
            if(localStorageService.get('setEnv')){
              urlBase.env = localStorageService.get('setEnv')
            }
            var networkGrade = null;
            return {
                clearUser: function () {
                    localStorageService.set('user', {});
                },
                setUser: function (user) {
                    localStorageService.set('user', JSON.stringify(user.toJSON()));
                },
                setAutoFetchCode: function(code){
                    localStorageService.set('autoFetchPatientCode', code);
                },
                setNetworkGrade: function(grade){
                    networkGrade = grade;
                },
                getNetworkGrade: function(){
                    return networkGrade;
                },
                getUser: function () {
                    return new UserModel(localStorageService.get('user'));
                },
                getAutoFetchCode: function(){
                    return localStorageService.get('autoFetchPatientCode');
                },
                clearUserData: function(){
                    localStorageService.remove('stopAutoSyncHealthkitData');
                    localStorageService.remove('stopAutoSyncEncounterData');
                    localStorageService.remove('stopAutoSyncC5Data');
                },
                savePatient: function (user) {
                    var deferred = $q.defer();
                    $http.put(urlBase.env + '/v1/rest/encounter/' + user.id, user).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(function (err) {
                        deferred.reject(new HttpError({
                            code: err.status,
                            message: err.data
                        }));
                    });
                    return deferred.promise;
                },
                loadMonitor: function (user) {
                    var deferred = $q.defer();
                    $http.get(urlBase.env + '/v1/rest/monitor/' + user.id, user).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(function (err) {
                        deferred.reject(new HttpError({
                            code: err.status,
                            message: err.data
                        }));
                    });
                    return deferred.promise;
                },
                saveMonitor: function (user) {
                    var deferred = $q.defer();
                    $http.put(urlBase.env + '/v1/rest/monitor/' + user.id, user).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(function (err) {
                        deferred.reject(new HttpError({
                            code: err.status,
                            message: err.data
                        }));
                    });
                    return deferred.promise;
                },
                sendForgotPassword: function (email) {
                    var deferred = $q.defer();
                    $http.post(urlBase.env + '/providers/forgotpass', {email: email}).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(function (err) {
                        deferred.reject(new HttpError({
                            code: err.status,
                            message: err.data
                        }));
                    });

                    return deferred.promise;
                }
            };
        }];
    }])
    .factory('synsormed.services.user.UserModel', ['$injector', function ($injector) {

        var fields = ['isEnrolled', 'name','code', 'fee', 'email', 'type', 'callerId', 'paymentStatus', 'paid', 'termsAccepted', 'id', 'providerId', 'weemoToken','isMonitor','createdAt','nextReading','appointmentMeta','providerName','practiceName','autoFetch','oauthAvailable','phoneNumber', 'patientName', 'patientEmail', 'patientPhone', 'patientAddress', 'patientCity', 'patientState', 'theme'];

        function createField(field) {
            return {
                get: function () {
                    return this.data[field];
                },
                set: function (value) {
                    this.data[field] = value;
                }
            };
        }

        var UserModel = function (userData) {
            this.data = {};
            this.fromJSON(userData);
            for(var i = 0, l = fields.length; i < l; i++) {
                Object.defineProperty(this, fields[i], createField(fields[i]));
            }

        };
        _.extend(UserModel.prototype, {
            toJSON: function () {
                return _.clone(this.data);
            },
            fromJSON: function (userData) {
                _.extend(this.data, _.pick(userData, fields));
            },
            save: function (skipRemote) {
                $injector.get('synsormed.services.user.UserService').setUser(this);
                if(!skipRemote) {
                    if(this.isMonitor){
                        return $injector.get('synsormed.services.user.UserService').saveMonitor(this);
                    } else {
                        return $injector.get('synsormed.services.user.UserService').savePatient(this);
                    }
                }
            }
        });
        return UserModel;
    }]);
