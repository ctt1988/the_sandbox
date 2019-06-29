'use strict';

angular.module('synsormed.features.reports', [
    'synsormed.services.user',
    'synsormed.services.report',
    'synsormed.directives.indicatorMetrics'
])
.controller('ReportsController', [
    '$scope',
    '$modal',
    'users',
    'synsormed.services.UserService',
    function($scope, $modal, users, UserService){
        $scope.user = UserService.fetchCachedUser();
        $scope.users = users;
        $scope.loadComplianceReport = function(){
            $scope.$broadcast('loadComplianceReport');
        };
        $scope.loadRPMReport = function() {
          $modal.open({
              templateUrl: 'javascripts/app/features/reports/rpm/rpm.html',
              controller: 'RpmReportController',
              windowClass: 'rpm-report-modal'
          });
        }

        $scope.loadBillingReport = function() {
          $modal.open({
              templateUrl: 'javascripts/app/features/reports/billing/billing.html',
              controller: 'BillingReportController',
              windowClass: 'rpm-report-modal'
          });
        }
    }
])
.controller('ComplianceReportController',[
    '$scope',
    '$filter',
    'synsormed.services.ReportService',
    function($scope, $filter, ReportService){
        var user = $scope.user;
        $scope.pageCount = 0;
        $scope.filtered = [];
        $scope.monitors = [];
        $scope.masterMonitors = [];
        $scope.reportTitle = 'SynsorMed Compliance Report ' + moment().format('MMM-DD-YYYY').toString();

        $scope.showUser = {
            id: 0
        };

        $scope.keyOne = {text: 'Code', dataKey: 'code'};
        $scope.keyTwo = {text: 'Patient name', dataKey: 'patientName'};

        var addDisplayField = function(currentKey){
            $scope.pagination.finalMonitors = _.forEach($scope.pagination.finalMonitors, function(t){
                t.display = t[currentKey];
            });
        };

        $scope.toggleData = function(){
            var currentKey = $scope.keyOne;
             $scope.keyOne = angular.copy($scope.keyTwo);
             $scope.keyTwo = currentKey;
             addDisplayField($scope.keyOne.dataKey);
        };

        $scope.$watch('showUser.id', function(selectedId){
            if(selectedId > 0){
                $scope.monitors = $scope.masterMonitors.filter(function (u) {
                    return u.providerId === selectedId;
                });
            }
            else{
                $scope.monitors = $scope.masterMonitors;
            }

            filterMonitors();
        });

        $scope.pagination = {
            pageSizes: [5, 10, 25, 50, 100],
            pageSize: 5,
            page: 1,
            finalMonitors: []
        };

        var addTempUser = function(allUsers){
           if(!allUsers.length) return;
           var temp = { id: 0, name: 'All', role: 'Provider' };
           $scope.users.unshift(temp);
        };

        if(user.role === 'Admin'){
            $scope.users = $scope.users.filter(function (u) {
                return u.role === 'Provider';
            });
            addTempUser($scope.users);
        }
        else if(user.role === 'Provider'){
            $scope.users = $scope.users.filter(function (u) {
                return u.id === user.id;
            });
        }

        $scope.loadComplianceReport = function(){
            $scope.$emit('wait:start');
            ReportService.getComplianceReport()
            .then(function(data){
                $scope.masterMonitors = data;
                $scope.monitors = data;
                filterMonitors();
                $scope.showUser.id = 0;
                $scope.$emit('wait:stop');
            })
            .catch(function(err){
                $scope.$emit('wait:stop');
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Server error."
                });
                console.log(err);
            });
        };

        $scope.showPrevious = false;
        $scope.showNext = true;

        $scope.pageTurn = function (value) {
            if($scope.pagination.page == 1 && value < 0) return;
            if($scope.pagination.page == $scope.pageCount && value > 0) return;
            if($scope.pagination.page == $scope.pageCount -1  && value > 0){
              $scope.showNext = false;
              $scope.showPrevious = true;
            }
            if($scope.pagination.page == 2  && value < 0){
              $scope.showPrevious = false;
              $scope.showNext = true;
            }
            $scope.pagination.page = $scope.pagination.page + value;
        };

        $scope.pageTo = function (page) {
          if(page == 1){
            $scope.showNext = true;
            $scope.showPrevious = false;
          }
          if(page == $scope.pageCount){
            $scope.showPrevious = true;
            $scope.showNext = false;
          }
          if(page != 1 && page != $scope.pageCount){
            $scope.showPrevious = true;
            $scope.showNext = true;
          }
            $scope.pagination.page = page;
        };

        $scope.$watch('pagination.page', function () {
            $scope.pagination.finalMonitors = filterMonitorlist($scope.filtered);
        });

        $scope.$watch('pagination.pageSize', function (newValue, oldValue) {
            if(newValue != oldValue) $scope.pagination.page = 1;
            filterMonitors();
        });

        $scope.$on('loadComplianceReport',function(e,args){
            $scope.loadComplianceReport();
        });

        var filterMonitors = function(){
            var temp = $scope.monitors;
            $scope.filtered = $filter('orderBy')(temp, '-id');
            $scope.pagination.finalMonitors = filterMonitorlist($scope.filtered);
            updatePageCount();
            var currentKey = angular.copy($scope.keyOne);
            addDisplayField(currentKey.dataKey);
        };

        var filterMonitorlist = function (monitorlist) {
            if(monitorlist.length < $scope.pagination.pageSize) return monitorlist;
            //update page when all monitors of a page are deleted
            if(Math.ceil(monitorlist.length / $scope.pagination.pageSize) < $scope.pagination.page)
            $scope.pagination.page = $scope.pagination.page - 1;
            var end = $scope.pagination.page * $scope.pagination.pageSize;
            var start = ($scope.pagination.page - 1) * $scope.pagination.pageSize;
            if(end >= monitorlist.length)  end = monitorlist.length;
            return monitorlist.slice(start, end);
        };

        //update Pagination acc to length of Monitors
        var updatePageCount = function(){
            $scope.pageCount = Math.ceil($scope.filtered.length / $scope.pagination.pageSize);
            $scope.pages = [];
            for(var i = 1; i <= $scope.pageCount; i++)  $scope.pages.push(i);
        }
    }
])
.controller('PatientSummaryController', [
    '$scope',
    'result',
    '$modalInstance',
    'synsormed.services.ReportService',
    function($scope, result, $modalInstance, ReportService){
        $scope.result = result;
        $scope.ok = function(){
            $modalInstance.dismiss();
        };
        $scope.downloadPDF = function(){
            $scope.$emit('wait:start');
            ReportService.getPdfToken($scope.result.monitorId)
            .then(function(token){
                $scope.$emit('wait:stop');
                return ReportService.downLoadPdf(token, $scope.result.monitorId);
            })
            .catch(function(e){
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Unable to download pdf file."
                });
                $scope.$emit('wait:stop');
            });
        };
    }
])
.controller('ReportSummaryController', [
    '$scope',
    '$modal',
    'synsormed.services.ReportService',
    function($scope, $modal, ReportService){

        $scope.pagination = {
            pageSize: 5,
            page: 1,
            finalPatients: []
        };

        $scope.showSummary = function(monitorId){
            if(!monitorId) return;
            $scope.$emit('wait:start');
            ReportService.getSummaryReport(monitorId)
            .then(function(result){
                $modal.open({
                    templateUrl: 'javascripts/app/features/reports/summary/summary.html',
                    controller: 'PatientSummaryController',
                    windowClass: 'custom-patient-summary',
                    resolve: {
                        result: function () {
                            return result;
                        }
                    }
                });
                $scope.$emit('wait:stop');
            })
            .catch(function(err){
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Server error."
                });
                $scope.$emit('wait:stop');
                console.log(err);
            });
        };

        //update Pagination acc to length of Monitors
        var updatePageCount = function(){
            $scope.pageCount = Math.ceil($scope.patients.length / $scope.pagination.pageSize);
            $scope.pages = [];
            for(var i = 1; i <= $scope.pageCount; i++)  $scope.pages.push(i);
        }

        var filterPatientlist = function (patientlist) {
            if(patientlist.length < $scope.pagination.pageSize) return patientlist;
            var end = $scope.pagination.page * $scope.pagination.pageSize;
            var start = ($scope.pagination.page - 1) * $scope.pagination.pageSize;
            if(end >= patientlist.length)  end = patientlist.length;
            return patientlist.slice(start, end);
        };

        var filterPatients  = function(){
            var temp = $scope.patients;
            $scope.pagination.finalPatients = filterPatientlist(temp);
            updatePageCount();
        };

        $scope.pageTurn = function (value) {
            if($scope.pagination.page == 1 && value < 0) return;
            if($scope.pagination.page == $scope.pageCount && value > 0) return;
            $scope.pagination.page = $scope.pagination.page + value;
        };

        $scope.$watch('pagination.page', function () {
            if(!$scope.patients) return;
            $scope.pagination.finalPatients = filterPatientlist($scope.patients);
        });

        $scope.pageTo = function (page) {
            $scope.pagination.page = page;
        };

        $scope.search = function(){
            if(!$scope.keyword) return;
            var keyword = $scope.keyword.replace(/ /g,'');
            $scope.$emit('wait:start');
            ReportService.searchUser(keyword)
            .then(function(userResults){
                $scope.patients = userResults;
                filterPatients();
                $scope.searched = true;
                $scope.$emit('wait:stop');
                if(userResults && userResults.length == 1){
                    $scope.showSummary(userResults[0].id);
                }
            })
            .catch(function(err){
                $scope.$emit('wait:stop');
                $scope.$emit("notification", {
                    type: 'danger',
                    message: "Server error."
                });
                console.log(err);
            });
        };
    }
]);
