angular.module('synsormed.directives.stackedToggleProgressBar',[])
.controller('StackedToggleProgressDirectiveController',['$scope',function($scope){
  var total;

  $scope.$watch('data', function(newData){
    total = 0;

    _.forEach(newData, function(obj){
      total += obj.count
    });

    _.forEach(newData, function(obj){
      obj.percent = ((obj.count/total) * 100).toFixed(1);
    });
  });


}])
.directive('stackedToggleProgress', function () {
    return {
      restrict: 'E',
      templateUrl: "javascripts/app/directives/stacked-toggle-progress-bar/stacked-toggle-progress-bar.html",
      controller:"StackedToggleProgressDirectiveController",
      scope: {
        data: '=data',
        doc: '=for',
        total: '=total'
      },
      link: function() {
        var bar = $("#stackedProgressBar")
          , details = $("#toggle-switch-wrapper");

        bar.click(function(){
          details.toggleClass('switched');
        });
      },
      replace: true,
      transclude: true
    }
});
