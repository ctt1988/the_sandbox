angular.module('synsormed.services.patient', [])
.service('synsormed.services.PatientListService',[
 '$http', '$q', 'env', function ($http, $q, env) {
   return {
       getPatients : function(providerId, paranoid, getCount, page, pageSize, searchBox){
         var paranoid = paranoid ? paranoid : 0;
           var deferred = $q.defer();
           $http.get(env.apiBaseUrl + '/rest/provider/' + providerId + '/patient', {
               params:{
                   paranoid:paranoid,
                   getCount:getCount,
                   currentPage:page,
                   pageSize: pageSize,
                   searchBox: searchBox?searchBox:null
               }
           }).then(function (resp) {
               deferred.resolve(resp.data);
           }).catch(deferred.reject);
           return deferred.promise;
       },
       resetPatient: function(id){
         var deferred = $q.defer();
         $http.put(env.apiBaseUrl + '/rest/provider/' + id).then(function (resp) {
           deferred.resolve(resp.data);
         }).catch(deferred.reject);
         return deferred.promise;
       }
   };
 }])
.service('synsormed.services.PatientService',[
 '$http', '$q', 'env', function ($http, $q, env) {
   return {
      createPatient : function(data){
          var deferred = $q.defer();
          $http.post(env.apiBaseUrl + '/rest/patient', data).then(function (resp) {
              deferred.resolve(resp.data);
          }).catch(deferred.reject);
          return deferred.promise;
      },
      getPatient : function(pid){
          var deferred = $q.defer();
          $http.get(env.apiBaseUrl + '/rest/patient/'+pid).then(function (resp) {
              deferred.resolve(resp.data);
          }).catch(deferred.reject);
          return deferred.promise;
      },
      updatePatient : function(data){
          var deferred = $q.defer();
          $http.put(env.apiBaseUrl + '/rest/patient/'+data.id, data).then(function (resp) {
              deferred.resolve(resp.data);
          }).catch(deferred.reject);
          return deferred.promise;
      },
      deletePatient : function(pid, permanentDelete){
          var deferred = $q.defer();
          $http.delete(env.apiBaseUrl + '/rest/patient/'+pid,{
              params:{
                  permanentDelete: permanentDelete
              }
          }).then(function (resp) {
              deferred.resolve(resp.data);
          }).catch(deferred.reject);
          return deferred.promise;
      },
      uploadFileToUrl:function(file){
        var deferred = $q.defer();
        var fd = new FormData();
        fd.append('file', file);
        $http.post(env.apiBaseUrl + '/rest/upload/', fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        }).then(function (resp) {
            deferred.resolve(resp.data);
        }).catch(deferred.reject);
        return deferred.promise;
      },
      getRPMReport: function (startDate, endDate, orgId) {
        var deferred = $q.defer();
        $http.get(env.apiBaseUrl + '/rest/monitor/rpm-report', {
            params: {
                startDate: moment(startDate).format(),
                endDate: moment(endDate).format(),
                offset: new Date().getTimezoneOffset()
            }
        })
          .then(function (resp) {
              console.log('resp', resp.data)
              deferred.resolve(resp.data);
          }).catch(deferred.reject);
        return deferred.promise;
      },
      getBillingReport: function (startDate, endDate, orgId) {
        var deferred = $q.defer();
        $http.get(env.apiBaseUrl + '/rest/monitor/billing/report', {
            params: {
                startDate: moment(startDate).format(),
                endDate: moment(endDate).format(),
                offset: new Date().getTimezoneOffset()
            }
        })
          .then(function (resp) {
              console.log('resp', resp.data)
              deferred.resolve(resp.data);
          }).catch(deferred.reject);
        return deferred.promise;
      },
      getURL: function () {
        var url = env.apiBaseUrl + '../rpm_report.csv';
        return url;
      },
      getBillingReportURL : function(){
        var url = env.apiBaseUrl + '../billing_report.csv';
        return url;
      }
   };
}]);
