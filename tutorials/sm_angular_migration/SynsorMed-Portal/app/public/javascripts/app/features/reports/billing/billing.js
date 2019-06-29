'use strict';

angular.module('synsormed.features.reports.billing', [
])
.controller('BillingReportController', [
    '$scope',
    '$rootScope',
    '$modal',
    '$modalInstance',
    'synsormed.services.UserService',
    'synsormed.services.PatientService',
    'synsormed.services.adminInsight.InsightService',
    function($scope, $rootScope, $modal, $modalInstance, UserService, PatientService, InsightService){
      $scope.days = [
        {
          id:1,
          name: moment().format('MMMM YYYY')
        },
        {
          id:2,
          name: moment().subtract(1, 'month').endOf('month').format('MMMM YYYY')
        },
        {
          id:3,
          name: moment().subtract(2, 'month').endOf('month').format('MMMM YYYY')
        },
        {
          id:4,
          name: moment().subtract(3, 'month').endOf('month').format('MMMM YYYY')
        },
        {
          id:5,
          name: moment().subtract(4, 'month').endOf('month').format('MMMM YYYY')
        },
        {
          id:6,
          name: moment().subtract(5, 'month').endOf('month').format('MMMM YYYY')
        },
        {
          id:7,
          name: moment().subtract(6, 'month').endOf('month').format('MMMM YYYY')
        },
        {
          id:99,
          name: 'Custom'
        }
      ]

      $scope.day = {selectedDay:1};

      $scope.customDates = false;

      $scope.$watch('day.selectedDay', function(newValue, oldValue){
        $scope.customDates = false;
        if(newValue <99){
          $scope.firstDate = moment().subtract(newValue - 1, 'month').startOf('month').format('YYYY-MM-DD');
          $scope.secondDate = moment().subtract(newValue - 1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss');
          if(newValue == 0){
            $scope.secondDate = moment().add(1, 'days').format('YYYY-MM-DD');
          }
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
        console.log('custom date start', moment.utc($scope.firstDate).format());
        // if($scope.customDates){
        //   //getData();
        // }
      });

      $scope.$watch('date.dt2', function(secondDate){
        $scope.secondDate = moment(new Date(secondDate)).format('YYYY-MM-DD');
        console.log('custom date end', moment.utc($scope.secondDate).format());
        // if($scope.customDates){
        //   //getData();
        // }
      });

      $scope.requestReport = function(){
        if($scope.firstDate == 'Invalid date'){
          $scope.firstDate = moment().startOf('month').format();
          $scope.secondDate = moment().format('YYYY-MM-DD');
        }
        
        $scope.$emit('wait:start');
        var modalInstance = $modal.open({
            templateUrl: 'javascripts/app/features/reports/billing/gatheringdata.html',
            windowClass: 'rpm-report-modal'
        });

        PatientService.getBillingReport( moment.utc($scope.firstDate).format(),  moment.utc($scope.secondDate).format())
        .then(function(result){
          modalInstance.dismiss();
          $scope.$emit('wait:stop');
          $modal.open({
            templateUrl: 'javascripts/app/features/reports/billing/download.html',
            controller: 'BillingReportResultController',
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
.controller('BillingReportResultController',[
  '$scope',
  '$modal',
  '$modalInstance',
  'synsormed.services.PatientService',
  'hasResult',
  function($scope, $modal, $modalInstance, PatientService, hasResult){
    $scope.hasResult = hasResult;
    $scope.getBillingReportURL = function(){
      return PatientService.getBillingReportURL()
    }

    $scope.ok = function(){
      $modalInstance.dismiss();
    };
  }
]);

