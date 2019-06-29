angular.module('synsormed.services.oauth', [
  'LocalStorageModule',
  'synsormed.services.healthkit'
  ])
.provider('synsormed.services.oauth.OauthService', [function(){
  this.$get = [
    'localStorageService',
    '$http',
    '$q',
    'synsormed.env.urlBase',
    '$window',
    function (localStorageService, $http, $q, urlBase, $window) {
      if(localStorageService.get('setEnv')){
        urlBase.env = localStorageService.get('setEnv')
      }

      var __storage_key = 'synsormed:oauth:data';
      var __defaultServiceStorage_key = 'synsormed:default:service';

      return {
        getStorageKey : function(){
          return __storage_key;
        },
        //get the services list from API
        getServices : function(){
          var deferred = $q.defer();
          $http.get(urlBase.env + '/v1/service',{timeout:5000}).then(function (resp) {
              deferred.resolve(resp.data);
          }).catch(deferred.reject);
          return deferred.promise;
        },
        //remove Linked Service
        removeService : function(serviceName){
            var data = localStorageService.get(__storage_key);
            //if data is not null
            if(data)
            {
                var object = _.find(data, function(val) {
                      return val.name == serviceName;
                });
                if(object)
                {
                    _.pull(data, object);
                    localStorageService.set(__storage_key, data);
                    return true;
                }
                else
                {
                    return false;
                }
            }
            else {
                return false;
            }
        },
        //add new Linked Service
        addService : function(serviceOb){
            var data = localStorageService.get(__storage_key);
            var arr = [];
            //data is not null push new service into data and set localStorage
            if(data)
            {
                //data is array
                if(data[0])
                {
                    //push new service and oauth data in data(array)
                    var index = _.findIndex(data, function(row) {
                      return row.name == serviceOb.name;
                    });
                    if(index == -1)
                    {
                        data.push(serviceOb);
                        localStorageService.set(__storage_key, data);
                    }
                    else {
                        if(serviceOb.data)
                        {
                            data[index].data = serviceOb.data;
                            localStorageService.set(__storage_key, data);
                        }
                    }
                }
                //data is object
                else {
                    //create array and push previous data(object) and new serviceData(object)
                    if(!_.isEmpty(data))
                    {
                        arr.push(data);
                    }
                    else if(_.isEmpty(data))
                    {
                        localStorageService.set(__defaultServiceStorage_key, serviceOb.name);
                    }
                    arr.push(serviceOb);
                    localStorageService.set(__storage_key, arr);
                }
            }
            else {
                //create new array and set localStorage
                arr.push(serviceOb);
                localStorageService.set(__storage_key, arr);
            }
        },

        //store a selected service
        storeService : function(serviceOb){
            var data = localStorageService.get(__storage_key)
            localStorageService.set(__storage_key, serviceOb);
        },
        //get a stored service and its token
        getStoredService : function(){
          return localStorageService.get(__storage_key);
        },
        setDefaultConnectedService: function(name){
            localStorageService.set(__defaultServiceStorage_key, name);
        },
        getDefaultConnectedService: function(){
            var serviceName = localStorageService.get(__defaultServiceStorage_key);
            var data = localStorageService.get(__storage_key);
            if(serviceName && data){
                var index = _.findIndex(data, function(row) {
                  return row.name == serviceName;
                });
                if(index == -1)
                {
                    return null;
                }
                else{
                    return data[index];
                }
            }
            else {
                return null;
            }
        },
        //clear any stored token may belong to any service
        clearStoredService : function(){
          localStorageService.set(__storage_key, []);
        },

        //check if base url string is starting with other url string
        startsWith : function(base,str){
            return base.indexOf(str) == 0;
        },

        //check if a base url string has other url string in it
        hasUrl : function(base,url){
            return base.indexOf(url) > -1;
        },

        //extract the parameter from a url
        getParameterByName : function(url,name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(url);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        },

        //read service data from external API
        readAPIServiceData : function(encounterId){

          var deferred = $q.defer();
          $http.get(urlBase.env + '/v1/service/read/' + encounterId,{ timout : 15000 ,cache: false }).then(function (resp) {
              deferred.resolve(resp.data);
          }).catch(deferred.reject);
          return deferred.promise;

        },
        //unlink service from an encounter
        unlinkEncounter : function(encounterId){
            var deferred = $q.defer();
            $http.delete(urlBase.env + '/v1/rest/encounter/' + encounterId + '/unlink',{ timout : 10000 ,cache: false }).then(function (resp) {
                deferred.resolve(resp);
            }).catch(deferred.reject);
            return deferred.promise;
        },
        //unlink service from a monitor
        unlinkMonitor : function(monitorId){
            var deferred = $q.defer();
            $http.delete(urlBase.env + '/v1/rest/monitor/' + monitorId + '/unlink',{ timout : 10000 ,cache: false }).then(function (resp) {
                deferred.resolve(resp);
            }).catch(deferred.reject);
            return deferred.promise;
        },
        //check if expired or not
        checkOauthExpired : function(encounterId){

          var deferred = $q.defer();
          $http.get(urlBase.env + '/v1/service/expired/' + encounterId,{ timout : 15000 ,cache: false }).then(function (resp) {
              deferred.resolve(resp);
          }).catch(deferred.reject);
          return deferred.promise;

        },

        localOauth: function(serviceURL){
            var deferred = $q.defer();
            $http.get(serviceURL,{ timout : 15000 ,cache: false }).then(function (resp) {
                deferred.resolve(resp);
            }).catch(deferred.reject);
            return deferred.promise;
        },

        beginOauth : function(service){
            var deferred = $q.defer();
            var self = this;

            //need plugin https://github.com/apache/cordova-plugin-inappbrowser.git to work
            var ref = $window.open(service.apiUrl, '_blank', 'location=no,enableviewportscale=yes');

            ref.addEventListener('loadstop', function(event) {

              //if the url is same as callback url which will came after the api success
              if( self.hasUrl(event.url,service.callback) ) {

                  ref.executeScript({ code: "document.getElementsByTagName('pre')[0].innerHTML" },function(value){

                      if(value !== undefined){
                        var resp = JSON.parse(value);
                        if(resp.success === true){
                          self.storeService(service.name,resp.data);
                          ref.close();
                          deferred.resolve(resp.data);
                        } else {
                          ref.close();
                          deferred.reject();
                        }
                      } else {
                        ref.close();
                        deferred.reject();
                      }

                  });
                }

              });

              //set the meta tag to device-width by injecting script to oauth window

              ref.addEventListener('loadstop', function(event) {

                var metaContent = "width=device-width, initial-scale=1.0, maximum-scale=1.0";

                var scriptMetaInsert =  'function resize(){' +
                                        'var meta = document.querySelector("meta[name=viewport]");' +
                                        'if(meta){' +
                                        'meta.parentNode.removeChild(meta);' +
                                        '}' +
                                        'meta = document.createElement("meta");' +
                                        'meta.setAttribute("name","viewport");' +
                                        'meta.setAttribute("content","' + metaContent + '");' +
                                        'document.getElementsByTagName("head")[0].appendChild(meta);' +
                                        '}' +
                                        'resize()';

                ref.executeScript( { code : scriptMetaInsert },function(){});

              });

            return deferred.promise;
        }

      };
    }];
}])

/*
  Gather information about service and healthkit data. Perform management and revoke of service data
*/
.service('synsormed.services.oauth.OauthDataManagementService',[
  '$q',
  'synsormed.services.oauth.OauthService',
  'synsormed.services.healthkit.HealthkitService',
  function($q,OauthService,HealthkitService){

    //need to send data or not
    var send_data = true;

    return {

      //if use allow us to send data in this session
      canSendData : function(){
        return send_data;
      },

      grantSendData : function(){
        send_data = true;
      },

      revokeSendData : function(){
          send_data = false;
      },

      //check if any service linked with us
      //true means a service is linked
      checkLinkedStatus : function(){
        var deferred = $q.defer();

        //we can use sharing string to get connection status
        this.sharingString()
            .then(function(data){
                if(data !== false){ // in success case a string is passed here
                  deferred.resolve(true);
                } else {
                  deferred.resolve(false);
                }
            })
            .catch(function(err){
              deferred.reject(err);
            });

        return deferred.promise;
      },

      //remove any linked services from device
      removeLinkedServices : function(){
        OauthService.clearStoredService();
        this.revokeSendData();
        return true;
      },

      //get a captalized string about service connected
      sharingString : function(){
        var deferred = $q.defer(),
            oauth_data = OauthService.getStoredService();
        //we have service data
        if(!_.isEmpty(oauth_data)){
            //var tmpStr = oauth_data.name;
          var tmpStr = oauth_data[0].name;
          deferred.resolve(tmpStr.charAt(0).toUpperCase() + tmpStr.slice(1));
        } else {
		    //check to make sure plugin is active before checkAuth
            HealthkitService
            .checkAvailable()
            .then()
            {
                HealthkitService
                    .checkAuth(null,function(result){
                        result = result === true ? 'Healthkit' : false;
                        deferred.resolve(result);
                        },function(err){
                        deferred.reject(err);
                  });
            }
        }

        return deferred.promise;
      }
    }
}])
