angular.module('synsormed.directives.safereading', ["modelOptions"])
.controller('SafeReadingDirectiveController', [
    '$scope',
    '$window',
    function($scope, $window){
  var bp0, bp1, bp2, bp3, glu1, glu2;

  var origUB = $scope.upperbound;
  var origLB = $scope.lowerbound;
  var originalMeasurement = $scope.measurement ? $scope.measurement.name : '';

  var prevStatusSurveyId = $scope.statusSurveyId || false;

  $scope.selected = {
      statusSurveyId: $scope.statusSurveyId ? $scope.statusSurveyId : 0
  };

  $scope.$watch('selected.statusSurveyId', function(statusSurveyId, oldValue){
      if( prevStatusSurveyId && statusSurveyId && prevStatusSurveyId!=statusSurveyId){
          if($window.confirm('Changing the survey will delete the previous submissions from this patient.')){
               $scope.statusSurveyId = (statusSurveyId || null);
          }
          else{
               $scope.selected.statusSurveyId = prevStatusSurveyId;
          }
      }
      else{
           $scope.statusSurveyId = (statusSurveyId || null);
      }
  });

  var rangeCheck = function(bounds, limits){
    return ((limits[0] <= parseInt(bounds[0])) && (parseInt(bounds[0]) <= limits[1])) && ((limits[0] <= parseInt(bounds[1])) && (parseInt(bounds[1]) <= limits[1]));
  };

  //config model option for rangeslider
  $scope.modelOptionsConfig = { debounce: 1500 };

  $scope.$watch('measurement.name', function( newValue ) {
    newValue = newValue || '';
    switch(newValue.toLowerCase())
    {
      case "blood pressure":

      //remove old watches over bpslider
      if(bp0 && bp1 && bp2 && bp3)
      {
        bp0(); bp1(); bp2(); bp3();
      }

      $scope.bpslider = {
        min: 90,
        max: 120,
        min1: 60,
        max1: 80,
        ceil: 200,
        floor: 1
      };

      //if editing old monitor then
      if(isNaN($scope.upperbound))
      {
        var upperarr = $scope.upperbound.split('/');
        var lowerarr = $scope.lowerbound.split('/');
        $scope.bpslider.min = parseInt(upperarr[0]) || 90;
        $scope.bpslider.max = parseInt(upperarr[1]) || 120;
        $scope.bpslider.min1 = parseInt(lowerarr[0]) || 60;
        $scope.bpslider.max1 = parseInt(lowerarr[1]) || 80;
      }

      //watch the bp slider bounds and update the upper and lower selected value
      bp0 = $scope.$watch('bpslider.min', function() {
        $scope.upperbound = $scope.bpslider.min + "/" + $scope.bpslider.max;
      });
      bp1 = $scope.$watch('bpslider.max', function() {
        $scope.upperbound = $scope.bpslider.min + "/" + $scope.bpslider.max;
      });
      bp2 = $scope.$watch('bpslider.min1', function() {
        $scope.lowerbound = $scope.bpslider.min1 + "/" + $scope.bpslider.max1;
      });
      bp3 = $scope.$watch('bpslider.max1', function() {
        $scope.lowerbound = $scope.bpslider.min1 + "/" + $scope.bpslider.max1;
      });
      break;

      case "steps":
      case "glucose":
      case "oxygen flow":
      case "weight":
      case "heartrate":
      case "sleep":
      case "temperature":
      case "breath":
      case "caloric intake" :
          $scope.slider = {
             min: 2000,
             max: 2500,
             ceil: 3500,
             floor: 1200
         };
      case "oxygen saturation":
      default:
      //remove old watches over slider
      if(glu1 && glu2)
      {
        glu1(); glu2();
      }

      if(newValue.toLowerCase() == 'steps'){
        $scope.slider = {
          min: 2000,
          max: 10000,
          ceil: 50000,
          floor: 1000
        };
      }
      if(newValue.toLowerCase() == 'sleep'){
        $scope.slider = {
          min: 6,
          max: 10,
          ceil: 24,
          floor: 1
        };
      }
      if(newValue.toLowerCase() == 'glucose'){
        $scope.slider = {
          min: 80,
          max: 125,
          ceil: 200,
          floor: 1,
          step: 0.5,
          decimal: 2
        };
      }
      if(newValue.toLowerCase() == 'oxygen flow'){
        $scope.slider = {
          max: 2.0,
          ceil: 10,
          floor: 0,
          step: 0.5,
          decimal: 1
        };
      }
      if(newValue.toLowerCase() == 'weight'){
        $scope.slider = {
          min: 150,
          max: 250,
          ceil: 600,
          floor: 1
        };
      }
      if(newValue.toLowerCase() == 'heartrate'){
          $scope.slider = {
            min: 60,
            max: 100,
            ceil: 200,
            floor: 1
          };
      };
      if(newValue.toLowerCase() == 'temperature'){
          $scope.slider = {
             min: 97,
             max: 100,
             ceil: 115,
             floor: 90
          };
      }
      if(newValue.toLowerCase() == 'breath'){
          $scope.slider = {
             min: 10,
             max: 30,
             ceil: 70,
             floor: 1
          };
      }
      if(newValue.toLowerCase() == 'oxygen saturation'){
          $scope.slider = {
             min: 94,
             max: 99,
             ceil: 100,
             floor: 80
          };
      }
      if(newValue.toLowerCase() == 'status'){
          $scope.slider = {
             min: 0,
             max: 0,
             ceil: 0,
             floor: 0
          };

          $scope.statussurvey = 5;
      }
      if(newValue.toLowerCase() == 'peak flow rate'){
          $scope.slider = {
             min:500,
             max: 800,
             ceil: 800,
             floor: 100
          };
          if (originalMeasurement.toLowerCase() != 'peak flow rate' && !origUB && !origLB){
              $scope.lowerbound = 500;
              $scope.upperbound = 800;
          }

      }

      if($scope.slider.max){
        $scope.sliderValue = ($scope.slider.max * 10) - 10;
      }
      if($scope.lowerbound && $scope.upperbound)
      {
        if(rangeCheck([$scope.lowerbound, $scope.upperbound],[$scope.slider.floor, $scope.slider.ceil]))
        {
          $scope.slider.min = isNaN($scope.lowerbound) ? $scope.slider.min : parseFloat($scope.lowerbound);
          $scope.slider.max = isNaN($scope.upperbound) ? $scope.slider.max : parseFloat($scope.upperbound);
        }
      }
      //watch the slider bounds and update the upper and lower selected value
      glu1 = $scope.$watch('slider.min', function() {
        $scope.lowerbound = $scope.slider.min;
      });

      glu2 = $scope.$watch('slider.max', function() {
        if($scope.slider.max < 1){
          $scope.sliderValue = 0;
        }else{
          $scope.sliderValue = ($scope.slider.max * 10) - 10;
        }
        $scope.upperbound = $scope.slider.max;
      });
      break;

    }
  });
}])
.directive('safeReading', function () {
  return {
    restrict: 'E',
    templateUrl: "javascripts/app/directives/safereading/safereading.html",
    controller: "SafeReadingDirectiveController",
    scope: {
      measurement: '=measurement',
      upperbound: '=upperbound',
      lowerbound: '=lowerbound',
      statusSurvey: '=statusSurvey',
      statusSurveyId: '=statusSurveyId'
    }
  };
});
