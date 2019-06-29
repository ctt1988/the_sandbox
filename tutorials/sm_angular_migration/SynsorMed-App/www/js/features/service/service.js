angular.module('synsormed.controllers.service', [
  'synsormed.env',
  'synsormed.services.oauth',
  'synsormed.services.healthkit'
])
.controller('serviceListController',[
  '$scope',
  '$http',
  '$location',
  '$window',
  'synsormed.services.oauth.OauthService',
  'synsormed.services.healthkit.HealthkitService',
  'synsormed.services.oauth.OauthDataManagementService',
  function($scope,$http,$location,$window,OauthService,HealthkitService,OauthDataManagementService){

    $scope.services = {};
    $scope.healthkitAvailable = false;
    $scope.connected = OauthService.getStoredService();
    $scope.default = {};
    var defaultService = OauthService.getDefaultConnectedService();
    $scope.default.name = defaultService ? defaultService.name : null;

    $scope.canShare = OauthDataManagementService.canSendData();

    $scope.$emit('wait:start');

    //get the service list data
    OauthService.getServices().then(function(servicelist){
        _.map(servicelist, function(id, service){
            _.map($scope.connected, function(localService){
                if(localService.name == service)
                {
                    id.connectedLocal = true;
                }
            })
        });
        //we will set service list
        $scope.services = servicelist;

        //stop animating
        $scope.$emit('wait:stop');

    }).catch(function(err) {

        $scope.$emit('wait:stop');
        $scope.$emit('service:error',"Server Error");
        $scope.services = null;

    });

    //check if Healthkit is available or not on start up
    HealthkitService
    .checkAvailable()
    .then(function(data){
      $scope.healthkitAvailable = true;
    })
    .catch(function(err){
      $scope.healthkitAvailable = false;
    })

    //check if device is connected to Healthkit Service
    HealthkitService
    .checkAuth(null, function(success){
        $scope.healthKitConnected = success;
    },  function(err){
        $scope.healthKitConnected = false;
    });

    //unlink healthkit service
    $scope.unLinkHealthKit = function(){
        $scope.healthKitConnected = false;
        OauthDataManagementService.revokeSendData();
        $scope.$emit('notification:success','Device Successfully Unlinked');
        $location.path('/logout');
    };
    //get service details
    $scope.getServiceDetails = function(service){
        return $scope.services[service];
    };

    $scope.changeDefaultService = function(){
        OauthService.setDefaultConnectedService($scope.default.name);
    };

    //if a service is linked with app, it will remove it
    $scope.unlinkService = function(serviceName){
        if(OauthService.removeService(serviceName)){
          $scope.$emit('notification:success','Device Successfully Unlinked');
          $scope.$emit('wait:stop');
          $location.path('/logout');
        } else {
          $scope.$emit('notification:danger','Device Unlinking Failed');
          $location.path('/logout');
        }
    };
    $scope.refreshList = function(){
        $scope.connected = OauthService.getStoredService();
        $scope.$emit('wait:stop');
    };

    $scope.startOauth = function(service){

      var serviceData = $scope.getServiceDetails(service);
      // need plugin https://github.com/apache/cordova-plugin-inappbrowser.git to work
      var ref = $window.open(serviceData.apiUrl, '_blank', 'location=no,enableviewportscale=yes');

      var metaContent = "width=device-width, initial-scale=1.0, maximum-scale=1.0";

      var scriptMetaInsert = 'var meta = document.querySelector("meta[name=viewport]");' +
      'if(meta){' +
      'meta.parentNode.removeChild(meta);' +
      '}' +
      'meta = document.createElement("meta");' +
      'meta.setAttribute("name","viewport");' +
      'meta.setAttribute("content","' + metaContent + '");' +
      'document.getElementsByTagName("head")[0].appendChild(meta);' +
      'document.getElementsByTagName("pre")[0].innerHTML';

      ref.addEventListener('loadstop', function(event) {
          ref.executeScript({ code: scriptMetaInsert }, function(value){
              if(OauthService.hasUrl(event.url, serviceData.callback)) {
                  if(value !== undefined){
                      var resp = JSON.parse(value);
                      if(resp.success === true){
                          OauthService.addService({'name': service, 'data': resp.data});
                          OauthDataManagementService.grantSendData();
                          ref.close();
                          $location.path('/login/patient');
                          $scope.$emit('notification:success', "Service Connected");
                      } else {
                          ref.close();
                          $scope.$emit('notification:error', "Service Error");
                      }
                  } else {
                      ref.close();
                      $scope.$emit('notification:error', "Service Error");
                  }
              }
          });

      });
  };

  //authenticate via healthkit
  $scope.startHealthKitAuth = function(){
    HealthkitService
    .checkAvailable()
    .then(function(){

      //ask for user auth
      HealthkitService
      .performAuth()
      .then(function(data){
          if(data === true)
          {
              OauthDataManagementService.grantSendData();
              $location.path('/login/patient');
              $scope.$emit('notification:success',"Service Connected");
          }
          else {
              $location.path('/login/patient');
              $scope.$emit('notification:error',"Authorization Failed");
          }
      })
      .catch(function(err){
          console.log(err);
          $scope.$emit('notification:error',"Authorization Failed");
      });

    })
    .catch(function(){
      $scope.$emit('notification:error',"HealthKit App not available on this device.");
    });
  }

}]);
