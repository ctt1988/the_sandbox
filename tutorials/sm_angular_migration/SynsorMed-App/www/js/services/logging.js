angular.module('synsormed.services.logging', [])
    .service('synsormed.services.logging.time', [
        'localStorageService',
        '$http',
        '$route',
        '$location',
        'synsormed.services.user.UserService',
        'synsormed.env.urlBase',
        function (localStorageService, $http, $route, $location, UserService, urlBase) {
            if(localStorageService.get('setEnv')){
              urlBase.env = localStorageService.get('setEnv')
            }
            if(!window.device) {
                window.device = {};
            }
            return {
                log: function (tag) {
                    console.log("Logging: " + tag, {
                        code: UserService.getUser().code,
                        device: {
                            uuid: window.device.uuid,
                            model: window.device.model,
                            version: window.device.version,
                            platform: window.device.platform
                        },
                        time: (new Date()).getTime(),
                        tag: tag,
                        route: $location.path()
                    });
                    $http.post(urlBase.env + '/v1/log', {
                        code: UserService.getUser().code,
                        device: {
                            uuid: window.device.uuid,
                            model: window.device.model,
                            version: window.device.version,
                            platform: window.device.platform
                        },
                        time: (new Date()).getTime(),
                        tag: tag,
                        route: $location.path()
                    }, {timeout: 1000});
                }
            };
        }
    ]);
