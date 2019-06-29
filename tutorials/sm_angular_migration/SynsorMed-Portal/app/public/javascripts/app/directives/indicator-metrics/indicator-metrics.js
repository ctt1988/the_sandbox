angular.module('synsormed.directives.indicatorMetrics',[])
.controller('IndicatorMetricsDirectiveController', [
    '$scope',
    function($scope){
        if(!$scope.indicators || !$scope.indicators.length) return;
        _.forEach($scope.indicators, function(indicator){
            if(indicator.name.toLowerCase() != 'status') return;
            if(indicator.results && indicator.results.displayData && indicator.results.displayData[2]){
                var time = moment(indicator.results.displayData[2], 'YYYY-MM-DDTHH:mm:ss.sssZ').format('LT');
                var date = moment(indicator.results.displayData[2], 'YYYY-MM-DDTHH:mm:ss.sssZ').format('L');
                indicator.results.displayData[2] = time + ' ' +date;
            }
        });
    }
])
.directive('indicatorMetrics', function () {
    return {
        restrict: 'E',
        templateUrl: "javascripts/app/directives/indicator-metrics/indicator-metrics.html",
        controller:"IndicatorMetricsDirectiveController",
        scope: {
            indicators: '=indicators'
        },
        link: function() {

        },
        replace: true,
        transclude: true
    }
});
