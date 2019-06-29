'use strict';

angular.module('synsormed.features.reports.rpm', [
])
.controller('RpmReportController', [
    '$scope',
    '$rootScope',
    '$modal',
    '$modalInstance',
    'synsormed.services.UserService',
    'synsormed.services.PatientService',
    'synsormed.services.adminInsight.InsightService',
    function($scope, $rootScope, $modal, $modalInstance, UserService, PatientService, InsightService){
      $scope.user = UserService.fetchCachedUser();
      var currentDate = new Date();

      $scope.days = [
        {
          id:1,
          name: 'This Week'
        },
        {
          id:2,
          name: "This Month"
        },
        {
          id:3,
          name: 'This Quarter'
        },
        {
          id:4,
          name: 'This Year'
        },
        {
          id:5,
          name: 'Last Week'
        },
        {
          id:6,
          name: 'Last Month'
        },
        {
          id:7,
          name: 'Last Quarter'
        },
        {
          id:8,
          name: 'Last Year'
        },
        {
          id:99,
          name: 'Custom'
        }
      ]

      $scope.day = {selectedDay:1};

      $scope.customDates = false;

      $scope.globalAdmin = false;

      if($scope.user && $scope.user.role == 'GlobalAdmin'){
         $scope.globalAdmin = true;
      }

      if($scope.globalAdmin){
        InsightService.getAllOrganizations($scope.globalAdmin)
        .then(function(data){
          $scope.orgs = data;
          $scope.org = data[0];
          $scope.$emit('wait:stop');
        })
        .catch(function(err){
          $scope.orgs = [];
          $scope.$emit('wait:stop');
          $scope.$emit("notification", {
            type: 'danger',
            message: "Server error."
          });
        });
      }

      $scope.$watch('day.selectedDay', function(newValue, oldValue){
        $scope.customDates = false;
        if(newValue == 1){
          $scope.firstDate = moment().startOf('week').format('YYYY-MM-DD');
          $scope.secondDate = moment().add(1, 'days').add(8, 'hours').format('YYYY-MM-DD'); //adjusting for timezone differences
        }else if(newValue == 2){
          $scope.firstDate = moment().startOf('month').format('YYYY-MM-DD');
          $scope.secondDate = moment().add(1, 'days').add(8, 'hours').format('YYYY-MM-DD');
        }
        else if(newValue == 3){
          $scope.firstDate = moment().startOf('quarter').format('YYYY-MM-DD');
          $scope.secondDate = moment().add(1, 'days').add(8, 'hours').format('YYYY-MM-DD');
        }
        else if(newValue == 4){
          $scope.firstDate = moment().startOf('year').format('YYYY-MM-DD');
          $scope.secondDate = moment().add(1, 'days').add(8, 'hours').format('YYYY-MM-DD');
        }
        else if(newValue == 5){
          $scope.firstDate = moment().subtract(1, 'week').startOf('week').format('YYYY-MM-DD');
          $scope.secondDate = moment().subtract(1, 'week').endOf('week').add(1, 'days').format('YYYY-MM-DD');
        }
        else if(newValue == 6){
          $scope.firstDate = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
          $scope.secondDate = moment().subtract(1, 'month').endOf('month').add(1, 'days').format('YYYY-MM-DD');
        }
        else if(newValue == 7){
          $scope.firstDate = moment().subtract(1, 'quarter').startOf('quarter').format('YYYY-MM-DD');
          $scope.secondDate = moment().subtract(1, 'quarter').endOf('quarter').add(1, 'days').format('YYYY-MM-DD');
        }
        else if(newValue == 8){
          $scope.firstDate = moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD');
          $scope.secondDate = moment().subtract(1, 'year').endOf('year').add(1, 'days').format('YYYY-MM-DD');
        }
        else if(newValue == 99){
          $scope.customDates = true;
          $scope.date.dt1 = new Date();
          $scope.date.dt2 = new Date();
        }
        //getData();
      }, true);

      $scope.open = {};
      $scope.$watch('open.opened1', function(open){
        $scope.opened1 = true;
      });

      $scope.$watch('open.opened2', function(open){
        $scope.opened2 = true;
      });

      $scope.format = 'dd-MMMM-yyyy';
      $scope.maxDate = new Date();
      $scope.openCalender1 = function($event){
        $event.preventDefault();
        $event.stopPropagation();
        $scope.open.opened1 = true;
      }

      $scope.openCalender2 = function($event){
        $event.preventDefault();
        $event.stopPropagation();
        $scope.open.opened2 = true;
      }

      $scope.dateOptions = {
        formatYear: 'yy',
        startingDay: 1
      };

      $scope.date = {};

      $scope.$watch('date.dt1', function(firstDate){
        $scope.firstDate = moment(new Date(firstDate)).format('YYYY-MM-DD');
        if($scope.customDates){
          //getData();
        }
      });

      $scope.$watch('date.dt2', function(secondDate){
        $scope.secondDate = moment(new Date(secondDate)).add(1, 'days').add(8, 'hours').format('YYYY-MM-DD');
        if($scope.customDates){
          //getData();
        }
      });

      $scope.requestReport = function(){
        if($scope.firstDate == 'Invalid date'){
          $scope.firstDate = moment().startOf('week').format('YYYY-MM-DD');
          $scope.secondDate = moment().add(1, 'days').add(8, 'hours').format('YYYY-MM-DD');
        }

        $scope.$emit('wait:start');
        var modalInstance = $modal.open({
            templateUrl: 'javascripts/app/features/reports/rpm/gatheringReport.html',
            windowClass: 'rpm-report-modal'
        });

        PatientService.getRPMReport($scope.firstDate, $scope.secondDate)
        .then(function(result){
          modalInstance.dismiss();
          $scope.$emit('wait:stop');
          $modal.open({
            templateUrl: 'javascripts/app/features/reports/rpm/rpmReport.html',
            controller: 'RPMReportResultController',
            windowClass: 'rpm-report-modal',
            resolve: {
              hasResult: function() {
                return result === 'true';
              }
            }
          });
        })
        .catch(function(err){
          $scope.$emit('wait:stop');
          console.log(err);
        });
      }

      $scope.ok = function(){
          $modalInstance.dismiss();
      };

}])
.controller('RPMReportResultController',[
  '$scope',
  '$modal',
  '$modalInstance',
  'synsormed.services.PatientService',
  'hasResult',
  function($scope, $modal, $modalInstance, PatientService, hasResult){
    $scope.hasResult = hasResult;
    $scope.getURL = function(){
      return PatientService.getURL()
    }

    $scope.ok = function(){
      $modalInstance.dismiss();
    };
  }
])
