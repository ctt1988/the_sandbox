"use strict";
angular.module('synsormed.features.provider.monitor.details', [])
  .controller('details', [
    '$scope',
    '$modal',
    '$modalInstance',
    'series',
    'id',
    'date',
    function ($scope, $modal, $modalInstance, series, id, date) {
      var results = [];
      var ids = [];
      var pushIntoArray = false;

      _.forEach(series, function (chunk) {
        if (ids.indexOf(chunk.extra.id) == -1) ids.push(chunk.extra.id);
      });

      for (var i = series.length - 1; i >= 0; i--) {
        var chunk = series[i];
        if (pushIntoArray) results.push(chunk);
        if (chunk.extra.date == date) {
          results.push(chunk);
          pushIntoArray = true;
        }
        if (results.length == ids.length) pushIntoArray = false;

      }

      $scope.results = results.reverse();

      $scope.close = function () {
        $modalInstance.dismiss('cancel');
      };
    }
  ]);
