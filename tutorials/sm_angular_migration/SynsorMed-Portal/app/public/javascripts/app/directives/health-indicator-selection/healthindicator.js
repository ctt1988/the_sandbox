angular.module('synsormed.directives.healthindicator', [])
.directive('healthIndicator', [function () {
    return {
        restrict: 'E',
        templateUrl: "javascripts/app/directives/health-indicator-selection/healthindicator.html",
        controller: 'HealthIndicatorDirectiveController',
        scope: {
            measurementId: '=selectMeasurementId',
            measurements: '=measurements',
            upperbound: '=upperbound',
            lowerbound: '=lowerbound',
            repeatInterval: '=repeatInterval',
            sensitivity: '=sensitivity',
            serviceName: '=serviceName',
            oauthAvailable: '=oauthAvailable',
            isOutofBound: '=isOutofBound',
            isMissed: '=isMissed',
            diseases: '=diseases',
            displayDiseases: '=displayDiseases',
            diseasesId: '=diseasesId',
            statusSurvey: '=statusSurvey',
            statusSurveyId: '=statusSurveyId',
            isEducationChecked: '=isEducationChecked'
        }
    };
}])
.controller('HealthIndicatorDirectiveController', ['$scope', function($scope){

    $scope.getCurrent = function(Id)
    {

        return _.find($scope.measurements, function(chr) {
            return chr.id == Id;
        });
    };
    $scope.repeatIntervalInHours = $scope.repeatInterval / 3600;

    $scope.$watch('repeatIntervalInHours', function(){
        $scope.repeatInterval = $scope.repeatIntervalInHours * 3600;
    }, true);

    if(!$scope.measurementId)
    {
        $scope.measurementId = 12;//Sets the default indicator to show
        //$scope.upperbound = 125;
        //$scope.lowerbound = 100;
        $scope.repeatIntervalInHours = (86400 / (60 * 60));
        $scope.sensitivity = 2;
    }

    $scope.monitoringIntervals = [
            // {
            //     id: 8,
            //     name: "Thrice a day"
            // },
            // {
            //     id: .5 * 24,
            //     name: "Twice a day"
            // },
            {
                id: 1 * 24,
                name: "Daily"
            }
            // {
            //     id: 3 * 24,
            //     name: "Every 3rd day"
            // },
            //{
            //    id: 7 * 24,
            //    name: "Weekly"
            //}
        ];

    $scope.$watch('measurementId',function(){
        if($scope.getCurrent($scope.measurementId).name == 'Steps' || $scope.getCurrent($scope.measurementId).name == 'Sleep'){
                $scope.monitoringIntervals = [
                    {
                        id: 1 * 24,
                        name: "Daily"
                    }
                ];
                $scope.repeatIntervalInHours = 24;
            }
            else {
                $scope.monitoringIntervals = [
                    // {
                    //     id: 8,
                    //     name: "Thrice a day"
                    // },
                    // {
                    //     id: .5 * 24,
                    //     name: "Twice a day"
                    // },
                    {
                        id: 500 * 24, //Set a 500 day interval to negate need for tracking interval.
                        name: "N/A"
                    },
                    {
                        id: 1 * 24,
                        name: "Daily"
                    }
                    // {
                    //     id: 3 * 24,
                    //     name: "Every 3rd day"
                    // },
                    //{
                    //    id: 7 * 24,
                    //    name: "Weekly"
                    //}
                ];
            }
    });

}])
.directive('optionClassExpr', function ($compile, $parse) {
    var NG_OPTIONS_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;

    return {
        restrict: 'A',
        link: function optionClassExprPostLink(scope, elem, attrs) {
            var optionsExp = attrs.ngOptions;
            if (!optionsExp) return;

            var match = optionsExp.match(NG_OPTIONS_REGEXP);
            if (!match) return;

            var values = match[7];
            var classExpr = $parse(attrs.optionClassExpr);

            scope.$watchCollection(function () {
                return elem.children();
            }, function (newValue) {
                angular.forEach(newValue, function (child) {
                    var child = angular.element(child);
                    var val   = child.val();
                    if (val != 8) {
                        child.attr('class', attrs.optionClassExpr);
                        //$compile(child)(scope);
                    }
                });
            });
        }
    };
});
