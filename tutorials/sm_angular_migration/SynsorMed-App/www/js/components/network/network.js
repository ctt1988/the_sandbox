'use strict';

angular.module('synsormed.components.network2',['synsormed.env'])

/* Handle Request and Response for Network Scans */
.service('synsormed.components.network2.NetworkScanService',[
  '$http',
  '$q',
  function($http,$q){

    /**
     Accept an URL and convert it to randomized parameter based url
    */
    var urlRandomizer = function(url){
        return url.replace(/\/$/, "") + "?s=" + Math.random().toString(36).substring(7);
    };

    /**
     Perform a Get request

     @url , the url to perform request to
    */
    var doGet = function(url) {

        url = urlRandomizer(url);

        var deffered = $q.defer();
        $http.get(url,{timeout:10000})
            .success(function(data) {
              deffered.resolve(data);
            })
            .error(function(data) {
              deffered.reject(data);
            });

        return deffered.promise;
    };

    /**
     Perform a Post request

     @url  , the url to perform request to
     @data , data which has to be sent
    */
    var doPost = function(url, data) {
        var deffered = $q.defer();
        $http.post(url, data,{timeout:10000})
            .success(function(data) {
              deffered.resolve(data);
            })
            .error(function(data) {
              deffered.reject(data);
            });

        return deffered.promise;
    };

    return {
        ping: function(url) {
            return doGet(url)
        },
        download: function(url) {
            return doGet(url)
        },
        upload: function(url,uploadData) {
            return doPost(url, uploadData)
        }
    };
}])

/** Reponsible for generating data for upload */
.service('synsormed.components.network2.NetworkDataService',[function(){
    return {
      generate: function(length) {
          var data = [];
          for (var i = 0; i < length ; i++) {
              data.push('');
          }
          return data.join();
      }
    };
}])

/** Reponsible for testing latency */
.service('synsormed.components.network2.NetworkResponseTestService',[
  'localStorageService',
  '$q',
  'synsormed.components.network2.NetworkScanService',
  'synsormed.env.urlBase',
  function(localStorageService, $q,NetworkScanService,urlBase){
    if(localStorageService.get('setEnv')){
      urlBase.env = localStorageService.get('setEnv')
    }
    return {
      ping: function() {
          var deffered = $q.defer();

          var t0 = new Date().getTime();

          NetworkScanService.ping(urlBase.env + '/network/ping').then(function(){
            var time = (new Date().getTime() - t0);

            //time in milliseconds
            deffered.resolve(time);
          }).catch(function(err){
            deffered.reject(err);
          });

          return deffered.promise;
      }
    };
}])

/** Service to measure upload bandwidth **/
.service('synsormed.components.network2.NetworkUploadTestService',[
  'localStorageService',
  '$q',
  'synsormed.components.network2.NetworkScanService',
  'synsormed.components.network2.NetworkDataService',
  'synsormed.env.urlBase',
  function(localStorageService, $q,NetworkScanService,NetworkDataService,urlBase){
      if(localStorageService.get('setEnv')){
        urlBase.env = localStorageService.get('setEnv')
      }
      var performUpload = function(deffered,payloadData) {
          var t0 = new Date().getTime();
          NetworkScanService.upload(urlBase.env + '/network/upload', payloadData)
              .then(function() {

                  //time in seconds
                  var time = (new Date().getTime() - t0) / 1000;

                  //size of payload in Bytes
                  var size = payloadData.length;

                  deffered.resolve({
                      time: time,
                      size: size,
                      speed: size / time
                  });

              }, function(error) {
                deffered.reject(error);
              });
      };

      return {
        /* @length , in bytes how many bytes should be uploaded , default 256KB */
        begin : function(length){

          length = length || 1024 ;

          var deffered = $q.defer();
          performUpload(deffered,NetworkDataService.generate(length));
          return deffered.promise;
        }
      };
  }
])

/** Service to measure download bandwidth **/
.service('synsormed.components.network2.NetworkDownloadTestService',[
  '$q',
  'synsormed.components.network2.NetworkScanService',
  'synsormed.env.urlBase',
  function($q,NetworkScanService,urlBase){

      var performDownload = function(stage,data){
          var deffered = $q.defer();

          var t0 = new Date().getTime();
          //server should have 100kb file multiples
          var url = urlBase + '/network/download/' + (stage);

          NetworkScanService.download(url)
              .then(function(data) {
                  //time in seconds
                  var time = (new Date().getTime() - t0) / 1000;

                  //size of data in Bytes
                  var size = data.length;

                  deffered.resolve({
                      time: time,
                      size: size,
                      speed: size / time //B/s
                  });

              }, function(error) {
                deffered.reject(error);
              });

          return deffered.promise;
      }

      return {
        /* @length , in bytes how many bytes should be uploaded , default 100KB */
        begin : function(){
          var deffered = $q.defer();

          var data = [];

          performDownload(2).then(function(result){
            data[0] = result;
            return performDownload(1);
          }).then(function(result){
            data[1] = result;
            return performDownload(3);
          }).then(function(result){
            data[2] = result;
            deffered.resolve(data);
          }).catch(function(error){
            deffered.reject(error);
          });


          return deffered.promise;
        },


        shallow : function(){
          return performDownload(1);
        }
      };
  }
])

/** Service to control scans, analyze and gather reports **/
.service('synsormed.components.network2.NetworkAnalysisService',[
  '$q',
  'synsormed.components.network2.NetworkDownloadTestService',
  'synsormed.components.network2.NetworkUploadTestService',
  'synsormed.components.network2.NetworkResponseTestService',
  function($q,NetworkDownloadTestService,NetworkUploadTestService,NetworkResponseTestService){

    // It scans network for reliable results. But may takes more time
    var deepScan = function(){

        var deffered = $q.defer();
        NetworkDownloadTestService
        .begin().then(function(result){

          var sum = 0;
          var i = 0;
          angular.forEach(result,function(item){
            sum += item.speed;
            i++;
          });

          var download_result = sum / i; //B/sec

          //measure network latency
          NetworkResponseTestService.ping().then(function(latency){

            deffered.resolve({
              speed : download_result * 8, // Bits per sec
              latency : latency
            });

          });

      }).catch(function(error){
        deffered.reject(error);
      });
      return deffered.promise;

    };

    /*It scan network fast and is accurate enough. Perfect for doing regular scans
      Techincally it perform only download / upload check for one range only
    */
    var shallowScan = function(){
        var deffered = $q.defer();
        NetworkDownloadTestService
        .shallow().then(function(result){

          var download_result = result.speed; //B/sec

          //measure network latency
          NetworkResponseTestService.ping().then(function(latency){

            deffered.resolve({
              speed : download_result * 8, // Bits per sec
              latency : latency
            });

          });

      }).catch(function(error){
        deffered.reject(error);
      });
      return deffered.promise;
    };

    return {
        deep : function(){
          return deepScan()
        },
        shallow : function(){
          return shallowScan()
        }
    }

}])

/** service to grade the network **/
.factory('synsormed.components.network2.NetworkGrade',[
  function(){

    //range calculator
    var rangeCalculator = function(data,max,min){
        var range = parseInt( ((data - min) / (max - min)) * 10 );
        return range >= max ? max : range;
    };

    /** calculate the speed and range
      @param Float|Int , the speed in Kbits per sec
      @param Int , the latency in the milli sec
    **/
    return function(speed,latency){
      return rangeCalculator(parseInt( (rangeCalculator(speed,600,0) + rangeCalculator(latency,2000,0)) / 2 ),10,0) ;
    }
}])

/** Network background check service **/
.service('synsormed.components.network2.NetworkBackgroundScanService',[
  '$interval',
  'synsormed.env.network.scan.interval',
  'synsormed.components.network2.NetworkAnalysisService',
  'synsormed.components.network2.NetworkGrade',
  function($interval,scanInterval,NetworkAnalysisService,NetworkGrade){

      //scan interval time in milliseconds
      scanInterval = scanInterval || 10000;

      var scan;

      var currentGrade = 0;

      this.startScan = function(){
          if(scan) return true;

          scan = $interval(function () {
            NetworkAnalysisService.shallow().then(function(result){
              currentGrade = NetworkGrade(result.speed / 1024,result.latency);
            }).catch(function(error){
              currentGrade = 0;
            });
          }, scanInterval);
      };

      this.stopScan = function(){
          if(!scan) return true;

          $interval.cancel(scan);
          scan = undefined;
      };

      this.getCurrentNetworkGrade = function(){
        return currentGrade;
      };

      this.setNetworkGrade = function(grade){
        currentGrade = grade;
      };

      this.hasHighBandwidth = function(){
        return this.getCurrentNetworkGrade() >= 5;
      };
  }
])

/** directive to show the status of network **/
// .directive('networkLevel',function(){
//   return {
//     template : "<span ng-class=\" safe ? 'beacon network-gauge-strong' : 'beacon network-gauge-weak'\"></span>",
//     restrict : 'A',
//     scope : {
//       'safe' : '='
//     }
//   }
// });
