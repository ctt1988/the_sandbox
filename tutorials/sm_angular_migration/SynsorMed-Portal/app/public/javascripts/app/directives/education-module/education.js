angular.module('synsormed.directives.education', [])
.directive('education', [function () {
    return {
        restrict: 'E',
        templateUrl: "javascripts/app/directives/education-module/education.html",
        controller: 'EducationDirectiveController',
        scope: {
            displayDiseases: '=displayDiseases',
            diseases: '=diseases',
            diseasesId: '=diseasesId',
            isEducationChecked: '=isEducationChecked'
        }
    };
}])
.controller('EducationDirectiveController', ['$scope', function($scope){
    $scope.temp = {
        id: $scope.diseasesId ? $scope.diseasesId : ($scope.diseases.length ? $scope.diseases[0].id : null)
    };

    $scope.tempDiseases = {
       displayDiseases : $scope.isEducationChecked || null
    };

    var watchDiseases  = $scope.$watch('temp.id', function(){
        $scope.diseasesId = $scope.temp.id ? $scope.temp.id : null;
    });
    $scope.$watch('tempDiseases.displayDiseases', function(value){
      $scope.isEducationChecked = !!value;
      $scope.tempDiseases.displayDiseases = !!value;
    });
    $scope.$on('$destroy', function(){
        watchDiseases();
    });
}]);
