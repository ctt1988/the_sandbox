"use strict";

angular.module('synsormed.features.provider.monitor.map', [])
.controller('MonitorMapController', [
    '$scope',
    '$modalInstance',
    'location',
    'patientCode',
    '$q',
    function($scope, $modalInstance, location, patientCode, $q){
        $scope.patientCode = patientCode;
        $scope.location = location;
        var latitude = location ? location.coords.latitude : null;
        var longitude = location ? location.coords.longitude : null;
        $scope.userPosition = [latitude, longitude];

        $scope.ok = function(){
            $modalInstance.close();
        };
    }
])
.directive('reverseGeocode', ['$q', function ($q) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {

                var latLang = new google.maps.LatLng(attrs.lat, attrs.lng);

                function getAddress() {
                  var deferred = $q.defer();
                  var geocoder = new google.maps.Geocoder();
                  geocoder.geocode({ 'latLng': latLang }, function (results, status) {
                      if (status == google.maps.GeocoderStatus.OK) {
                          if (results.length && results[0]) {
                              deferred.resolve(results[0].formatted_address);
                          }
                      } else {
                          deferred.reject('Geocoder failed due to: ' + status);
                      }
                  });
                  return deferred.promise;
                }


                var promise = getAddress();
                promise.then(function(address) {
                    var mapOptions = {
                      zoom : 13,
                      center : latLang
                    }

                    scope.map = new google.maps.Map(element[0],
                        mapOptions);

                    scope.markers = [];
                    var infoWindow = new google.maps.InfoWindow();

                    var marker = new google.maps.Marker({
                      map : scope.map,
                      position : latLang,
                      title : address
                    });
                    marker.content = '<div class="infoWindowContent">'+ marker.title + '</div>';

                    google.maps.event.addListener(marker, 'click', function() {
                        infoWindow.setContent('<h4>' + marker.title + '</h4>'+ marker.content);
                        infoWindow.open(scope.map, marker);
                    });

                    scope.markers.push(marker);

                    scope.map.setCenter(latLang);
                })
                .catch(function(error){
                    console.log('error', error)
                });
            }
        }
    }]);
