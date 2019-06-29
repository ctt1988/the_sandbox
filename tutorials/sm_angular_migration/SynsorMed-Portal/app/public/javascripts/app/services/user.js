angular.module('synsormed.services.user', [
    'LocalStorageModule'
])
    .service('synsormed.services.UserService.SuperAdminState', [
        'localStorageService',
        function (localStorageService) {
            return {
                setState: function (value) {
                    sessionStorage.setItem('from-super-admin', value);
                },
                getState: function () {
                    return sessionStorage.getItem('from-super-admin');
                },
                clearState: function () {
                    sessionStorage.removeItem('from-super-admin');
                },
            };
        }])
    .service('synsormed.services.UserService', [
        '$rootScope',
        '$http',
        '$q',
        'env',
        'localStorageService',
        'synsormed.services.UserService.SuperAdminState',
        'synsormed.services.UserModel',
        function ($rootScope, $http, $q, env, localStorageService, SuperAdminState, UserModel) {
            var directUrlPath = '';
            return {
                login: function (username, password) {
                    var deferred = $q.defer();
                    SuperAdminState.clearState();

                    $http.post(env.apiBaseUrl + '/authenticate', {
                        username: username,
                        password: password
                    }).then(function (resp) {
                        if (resp.data.profileType && resp.data.profileType == 'synsormedWhite') {
                            localStorageService.set('profileType', true);
                        }
                        else {
                            localStorageService.set('profileType', '');
                        }
                        if (resp.data.csrfToken) {
                            sessionStorage.setItem('x-csrf', resp.data.csrfToken);
                            $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                        }
                        sessionStorage.setItem('X-Session-Token', resp.headers('X-Session-Token'));
                        $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                        deferred.resolve(resp.data.user);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },
                patientLogin: function (code) {
                    var deferred = $q.defer();
                    $http.post(env.apiBaseUrl + '/authenticate/encounter', { code: code }, { timeout: 10000 }).then(function (resp) {
                        if (resp.data.csrfToken) {
                            sessionStorage.setItem('x-csrf', resp.data.csrfToken);
                            $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                        }
                        sessionStorage.setItem('X-Session-Token', resp.headers('X-Session-Token'));
                        $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                        deferred.resolve(new UserModel(resp.data));
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                savePatient: function (user) {
                    var deferred = $q.defer();
                    $http.put(urlBase + '/v1/rest/encounter/' + user.id, user).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(function (err) {
                        deferred.reject(new HttpError({
                            code: err.status,
                            message: err.data
                        }));
                    });
                    return deferred.promise;
                },

                fetchCachedUser: function () {
                    return localStorageService.get('currentUser') || null;
                },

                setCachedUser: function (userData) {
                    localStorageService.set('currentUser', userData);
                },

                clearCachedUser: function () {
                    localStorageService.remove('currentUser');
                },

                fetchAllUsers: function (paranoid) {
                    var paranoid = paranoid ? paranoid : 0;
                    var deferred = $q.defer();
                    $http.get(env.apiBaseUrl + '/rest/user', {
                        params: {
                            paranoid: paranoid
                        }
                    }).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                fetchAllUsersPaginate: function (paranoid, currentPage) {
                    var paranoid = paranoid ? paranoid : 0;
                    var deferred = $q.defer();
                    $http.get(env.apiBaseUrl + '/rest/user/paginate', {
                        params: {
                            paranoid: paranoid,
                            currentPage: currentPage||1
                        }
                    }).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                createUser: function (userData) {
                    var deferred = $q.defer();
                    $http.post(env.apiBaseUrl + '/rest/user/', userData).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                updateUser: function (userData) {
                    var deferred = $q.defer();
                    $http.put(env.apiBaseUrl + '/rest/user/' + userData.id, userData).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                deleteUser: function (userId, permanentDelete) {
                    var deferred = $q.defer();
                    $http.delete(env.apiBaseUrl + '/rest/user/' + userId, {
                        params: {
                            permanentDelete: permanentDelete
                        }
                    }).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                resetUser: function (id, reset) {
                    var deferred = $q.defer();
                    $http.put(env.apiBaseUrl + '/rest/user/' + id, {
                        reset: reset
                    }).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                //send reset link to user email
                resetPasswordLink: function (email) {
                    var deferred = $q.defer();
                    $http.post(env.apiBaseUrl + '/forgot/send/' + email, {}, { timeout: 10000 }).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                resetPasswordViaCode: function (data) {
                    var deferred = $q.defer();
                    $http.post(env.apiBaseUrl + '/forgot/reset/', { data: data }, { timeout: 10000 }).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                emergencyAccess: function (otp) {
                    var deferred = $q.defer();
                    $http.post(env.apiBaseUrl + '/authenticate/otp', { otp: otp }, { timeout: 10000 }).then(function (resp) {
                        if (resp.data.csrfToken) {
                            sessionStorage.setItem('x-csrf', resp.data.csrfToken);
                            $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                        }
                        sessionStorage.setItem('X-Session-Token', resp.headers('X-Session-Token'));
                        $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                        deferred.resolve(resp.data.user);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                // get one time password (otp) for user
                getOtpCode: function (userId) {
                    var deferred = $q.defer();
                    $http.get(env.apiBaseUrl + '/rest/user/otp/' + userId, { timeout: 10000 }).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                getStatusSurvey: function (userId) {
                    var deferred = $q.defer();
                    $http.get(env.apiBaseUrl + '/rest/user/statusSurvey/' + userId, { timeout: 10000 }).then(function (resp) {
                        deferred.resolve(resp.data);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                superUserLogin: function (adminId, orgId) {
                    var deferred = $q.defer();
                    $http.post(env.apiBaseUrl + '/authenticate/superadmin/login', { adminId: adminId, orgId: orgId }, { timeout: 10000 }).then(function (resp) {
                        if (resp.data.csrfToken) {
                            sessionStorage.setItem('x-csrf', resp.data.csrfToken);
                            $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                        }
                        sessionStorage.setItem('X-Session-Token', resp.headers('X-Session-Token'));
                        SuperAdminState.setState(resp.data.superAdmin);
                        $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                        deferred.resolve(resp.data.user);
                    }).catch(deferred.reject);
                    return deferred.promise;
                },

                goToSuperUserAccount: function () {
                    var defer = $q.defer();
                    SuperAdminState.clearState();

                    $http.post(env.apiBaseUrl + '/authenticate/superadmin/goBack', { timeout: 10000 }).then(function (resp) {
                        if (resp.data.csrfToken) {
                            sessionStorage.setItem('x-csrf', resp.data.csrfToken);
                            $http.defaults.headers.common['x-csrf'] = '"' + resp.data.csrfToken + '"';
                        }
                        sessionStorage.setItem('X-Session-Token', resp.headers('X-Session-Token'));
                        $http.defaults.headers.common['X-Session-Token'] = resp.headers('X-Session-Token');
                        defer.resolve(resp.data.user);
                    }).catch(defer.reject);

                    return defer.promise;
                },

                directRequestUrl: function (directUrl) {
                    directUrlPath = directUrl;
                },
                redirectPath: function () {
                    return directUrlPath;
                }

            };

        }])
    .factory('synsormed.services.UserModel', [
        '$q',
        '$injector',
        function ($q, $injector) {
            var fields = ['name', 'code', 'fee', 'email', 'type', 'callerId', 'paymentStatus', 'paid', 'termsAccepted', 'id', 'providerId', 'weemoToken', 'isMonitor', 'isEncounter', 'createdAt', 'nextReading', 'appointmentMeta', 'providerName', 'practiceName', 'autoFetch', 'oauthAvailable'];

            var createField = function (field) {
                return {
                    get: function () {
                        return this.data[field];
                    },
                    set: function (value) {
                        this.data[field] = value;
                    }
                };
            };

            var UserModel = function (userData) {
                this.data = {};
                this.fromJSON(userData);
                for (var i = 0, l = fields.length; i < l; i++) {
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
                    var defer = $q.defer();
                    if (!skipRemote) {
                        if (this.isMonitor) {
                            return defer.reject({ message: 'Code is monitor' });
                        }
                        else {
                            return defer.resolve($injector.get('synsormed.services.UserService').savePatient(this));
                        }
                    }
                    return defer.promise;
                }
            });
            return UserModel;
        }]);
