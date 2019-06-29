angular.module('synsormed.services.util', [])
    .service('synsormed.services.util.httpretryservice', [
        '$http',
        '$q',
        function ($http, $q) {
        return function (path, method, data) {
            var MAX_REQUESTS = 10,
            counter = 0,
            deferred = $q.defer();

            var req = {};

            if(method == "GET"){

                req = {
                    method: method,
                    url: path
                }

            }else if(method == "POST" || method == "PUT"){

                req = {
                    method: method,
                    url: path,
                    data: data
                }
            }

            var doQuery = function(){
                $http(req)
                .then(function(resp){
                    //console.log("*** Successfully did the http query: " + JSON.stringify(resp));
                    deferred.resolve(resp);
                })
                .catch(function(e){
                    if(e.status == 401){

                        deferred.reject(e);

                    }else{

                        if(counter < MAX_REQUESTS){
                            
                            setTimeout(function(){
                                console.log("**** Failed the : " + method + " to the following path: " + path + " ::: " + counter + " times ***");
                                doQuery();
                            },1000);

                            counter ++;

                        }else{
                            deferred.reject(e);
                        }
                    }
                });
            }
            
            doQuery();

            return deferred.promise;

        };
    }]);
