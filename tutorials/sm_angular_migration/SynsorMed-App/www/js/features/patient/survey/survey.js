angular.module('synsormed.controllers.provider.survey', [
        'synsormed.services.survey'
    ]).
    controller('patientSurveyController', [
        '$scope',
        '$location',
        'synsormed.services.survey.SurveyService',
        '$route',
        'synsormed.services.logging.time',
        'encounter',
        function($scope, $location, SurveyService, $route, TimeLogger, encounter) {
            TimeLogger.log("SurveyScreen");
            $scope.questions = encounter.surveyQuestions;
            $scope.answers = [];
            $scope.alterations.body = 'darkbg';
            for (var i = 0, l = $scope.questions.length; i < l; i++) {
                $scope.answers[i] = null;
            }

            $scope.setAnswer = function (index, value) {
                $scope.answers[index] = value;
                console.log($scope.answers, value);
                if(index === $scope.answers.length -1) {
                    $scope.save();
                }
            };

            $scope.save = function () {
                $scope.$emit('wait:start');
                SurveyService.saveSurveyAnswers(encounter.id, $scope.answers).then(function () {
                    $location.path('/');
                    $scope.$emit('notification:information', "Survey answers saved");
                    $scope.$emit('wait:stop');
                }).catch(function () {
                    $scope.$emit('wait:stop');
                });
            };
        }
    ]);
