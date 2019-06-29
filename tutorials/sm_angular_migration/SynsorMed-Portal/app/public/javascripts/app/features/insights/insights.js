'use strict';

angular.module('synsormed.features.insights', [
    'synsormed.services.practice',
    'synsormed.services.user'
])
    .controller('InsightsController', [
        '$scope',
        'synsormed.services.UserService',
        function ($scope, UserService) {

            $scope.user = UserService.fetchCachedUser();

            //change title for page
            $scope.$emit('pageLoaded', {
                title: "Insights"
            });

            $scope.loadChart = function(){
                $scope.$broadcast('loadChart',{
                  org_id : $scope.user.org_id
                });
            };

            $scope.loadCCM = function(){
                $scope.$broadcast('loadCCM',{
                  org_id : $scope.user.org_id
                });
            };

            $scope.loadSurveyChart = function(){
                $scope.$broadcast('loadSurveyChart',{
                  org_id : $scope.user.org_id
                });
            };

            $scope.loadLeaderboard = function(){
                $scope.$broadcast('loadLeaderboard',{
                  org_id : $scope.user.org_id
                });
            };

        }])
    .controller('InsightsDashboardController', [
        '$scope',
        'synsormed.services.UserService',
        'synsormed.services.InsightService',
        function ($scope, UserService, InsightService) {

          $scope.insights = null;

          $scope.loadPracticeInsights = function(org_id){
            $scope.$emit('wait:start');
            InsightService.getPracticeInsights(org_id).then(function(insights){
              $scope.insights = insights;
              $scope.$emit('wait:stop');
            }).catch(function(){
              $scope.$emit('wait:stop');
              $scope.$emit("notification", {
                  type: 'danger',
                  message: "Server error."
              });
            });
          };

        }])
    .controller('InsightsUserController', [
        '$scope',
        '$modal',
        '$filter',
        'synsormed.services.UserService',
        'synsormed.services.InsightService',
        function ($scope, $modal,$filter, UserService, InsightService) {
            //get all users
            UserService.fetchAllUsers().then(function (users) {
                $scope.users = $filter('filter')(users,{ role : 'Provider'});
            });

            //fetch insight details for a doctor
            $scope.getDetails = function(provider){

              var instance = $modal.open({
                  templateUrl: 'javascripts/app/features/insights/details.html',
                  controller: 'InsightsUserDetailsController',
                  resolve: {
                      user: function () {
                          return $.extend({}, provider);
                      },
                      encounterCount : function(){
                          return InsightService.countEncounters(provider.id,7).catch(function(){
                            //if no counts loaded then return 0
                            return 0;
                          });
                      },
                      insights : function(){
                          return InsightService.getProviderInsights(provider.id);
                      }
                  }
              });
            };

        }])
    .controller('InsightsUserDetailsController',[
      '$scope',
      '$modalInstance',
      'user',
      'encounterCount',
      'insights',
      function($scope,$modalInstance,user,encounterCount,insights){

          $scope.user = user;
          $scope.encounterCount = encounterCount;
          $scope.insights = insights;

          $scope.ok = function () {
              $modalInstance.dismiss('cancel');
          };
      }
    ])
    .controller('InsightsGraphController',[
      '$scope',
      '$filter',
      'synsormed.services.InsightService',
      function($scope,$filter,InsightService){

        $scope.$on('loadChart',function(e,args){
          $scope.days = 7;
        });

        $scope.$watch('days',function(){
          $scope.loadPracticeDeepInsights($scope.user.org_id,$scope.days - 1);
        });

        $scope.chartSeries = [
            {
                showInLegend: false,
                data: [],
                //color: '#007872',
                type : 'column'
            }
        ];

        $scope.xAxis = {
            gridLineWidth: 0,
            labels: { enabled: true, style : { fontWeight:'bold' } },
            title : { text : null },
            categories:[]
        };

        //get the series plottable data from deep insights api services
        $scope.loadPracticeDeepInsights = function(org_id,days){

          //init load of controller ignore the empty days which are sent by $watch
          if(!days){
              return;
          }

          $scope.$emit('wait:start');

          InsightService.getPracticeInsightSeries(org_id,days).then(function(data){

            $scope.chartSeries[0].data = data.series;
            $scope.xAxis.categories = data.categories;

            $scope.$emit('wait:stop');

          }).catch(function(){

            $scope.$emit('wait:stop');
            $scope.$emit("notification", {
                type: 'danger',
                message: "Server error."
            });

          });

        };

        $scope.chartConfig = {
            options: {
               navigation: {
                  buttonOptions: {
                     enabled: false
                  }
              },
              chart : {
                type : 'column',
                backgroundColor:'rgba(255, 255, 255, 0.1)'
              },
              plotOptions: {
                  column: {
                      states: {
                        hover:
                        {
                          color: {
                            linearGradient : {x1: 0,y1: 1,x2: 0,y2: 0},
                            stops: [
                                [0, '#F05F3A'],
                                [1, '#EF3809']
                              ]
                          },
                        }
                      },
                      color: {
                        linearGradient : {x1: 0,y1: 0,x2: 0,y2: 1},
                        stops: [
                            [0, '#00918a'],
                            [1, '#00ABA2']
                          ]
                      },
                  }
                },
                tooltip: {
                    borderWidth: 0,
                    useHTML:true,
                    backgroundColor:'#FFFFFF',
                    formatter: function() {
                       return '<table class="text-left table-condensed">' +
                              '<tr><td><b>' +this.point.extra.calls+ '</b></td><td>Encounters</td></tr>' +
                              '<tr><td><b>' +$filter('secondsToHoursString')(this.point.extra.duration)+ '</b></td><td> Total Call Time</td></tr>' +
                              '<tr><td><b>' +$filter('secondsToHoursString')(parseInt(this.point.extra.duration / this.point.extra.active_calls))+ '</b></td><td> Avg. Call Duration</td></tr>' +
                              '<tr><td><b>' +$filter('secondsToHoursString')(parseInt(this.point.extra.wait / this.point.extra.active_calls))+ '</b></td><td> Avg. Wait Duration</td></tr>' +
                              '</table>';
                   }
                },
                yAxis: {
                  gridLineWidth: 0,
                  labels: { enabled: false },
                  title : { text : null },
                },
                xAxis: $scope.xAxis,
                series: $scope.chartSeries,
            },
            series: $scope.chartSeries,
            title: { text: null },
            credits:{ enabled:false },
            loading: false,
            xAxis: $scope.xAxis,
          };

      }
    ])
    .controller('InsightsCCMController',[
      '$scope',
      '$element',
      'synsormed.services.InsightService',
      function($scope,$element,InsightService){
        $scope.logs = null;
        $scope.days = 7;

        //20 min is safe level for now
        $scope.safeLevel = 20 * 60;

        $scope.getLogs = function(org_id,days){

          days = days || 7;

          days--;

          $scope.$emit('wait:start');
          InsightService.getPracticeCCMInsights(org_id,days).then(function(logs){
            $scope.logs = logs;
            $scope.$emit('wait:stop');
          }).catch(function(){
            $scope.$emit('wait:stop');
            $scope.$emit("notification", {
                type: 'danger',
                message: "Server error."
            });
          });
        };

        $scope.$on('loadCCM',function(e,args){
          if($scope.logs == null){
            $scope.getLogs(args.org_id,$scope.days);
          }
        });

        $scope.$watch('days',function(){
          //save API calls, only perform reload if view is visible
          if($element.is(":visible")){
            $scope.getLogs($scope.user.org_id,$scope.days);
          }
        });

      }
    ])
    .controller('InsightsSurveyGraphController',[
      '$scope',
      'synsormed.services.InsightService',
      function($scope,InsightService){

        $scope.$on('loadSurveyChart',function(e,args){
          $scope.loadPracticeSurveyResponse(args.org_id);
        });

        $scope.chartSeries = [
            {
                showInLegend: false,
                data: [],
                //color: '#007872',
                type : 'column'
            }
        ];

        $scope.xAxis = {
            gridLineWidth: 0,
            labels: { enabled: true, style : { fontWeight:'bold' } },
            title : { text : null },
            categories:[]
        };

        //get the series plottable data from deep insights api services
        $scope.loadPracticeSurveyResponse = function(org_id){

          $scope.$emit('wait:start');

          InsightService.getSurveyResponseInsights(org_id).then(function(data){
            console.log(data.series);
            $scope.chartSeries[0].data = data.series;
            $scope.xAxis.categories = data.categories;

            $scope.$emit('wait:stop');

          }).catch(function(){

            $scope.$emit('wait:stop');
            $scope.$emit("notification", {
                type: 'danger',
                message: "Server error."
            });

          });

        };

        $scope.chartConfig = {
            options: {
               navigation: {
                  buttonOptions: {
                     enabled: false
                  }
              },
              chart : {
                type : 'column',
                backgroundColor:'rgba(255, 255, 255, 0.1)'
              },
              plotOptions: {
                  column: {
                      stacking:'normal',
                      states: {
                        hover:
                        {
                          color: {
                            linearGradient : {x1: 0,y1: 1,x2: 0,y2: 0},
                            stops: [
                                [0, '#F05F3A'],
                                [1, '#EF3809']
                              ]
                          },
                        }
                      },
                      color: {
                        linearGradient : {x1: 0,y1: 0,x2: 0,y2: 1},
                        stops: [
                            [0, '#00918a'],
                            [1, '#00ABA2']
                          ]
                      },
                  }
                },
                tooltip: {
                    borderWidth: 0,
                    useHTML:true,
                    backgroundColor:'#FFFFFF',
                    formatter: function() {
                       return '<table style="table-layout:fixed;width:300px;" class="text-left">' +
                              '<tr><td><b> Question : </b></td><td><span class="wrap">' +this.point.extra.question+ '</span></td></tr>' +
                              '<tr><td><b>Positive : </b></td><td>' +this.point.extra.positive+ '</td></tr>' +
                              '<tr><td><b>Negative : </b></td><td>' +this.point.extra.negative+ '</td></tr>' +
                              '</table>';
                   }
                },
                yAxis: {
                  gridLineWidth: 0,
                  labels: { enabled: false },
                  title : { text : null },
                  stackLabels: {
                    enabled: true,
                    style: {
                       fontWeight: 'bold',
                       color: 'grey'
                    },
                    formatter: function() {
                       return this.total + '%';
                    }
                  }
                },
                xAxis: $scope.xAxis,
                series: $scope.chartSeries,
            },
            series: $scope.chartSeries,
            title: { text: null },
            credits: { enabled:false },
            loading: false,
            xAxis: $scope.xAxis
          };

      }
  ])
  .controller('InsightsLeaderboardController', [
      '$scope',
      'synsormed.services.InsightService',
      function($scope, InsightService){
          $scope.pageCount = 0;

          var filterMonitorlist = function (monitorlist) {
              if(monitorlist.length < $scope.pagination.pageSize) return monitorlist;
              //update page when all monitors of a page are deleted
              if(Math.ceil(monitorlist.length / $scope.pagination.pageSize) < $scope.pagination.page)
              $scope.pagination.page = $scope.pagination.page - 1;
              var end = $scope.pagination.page * $scope.pagination.pageSize;
              var start = ($scope.pagination.page - 1) * $scope.pagination.pageSize;
              if(end >= monitorlist.length)  end = monitorlist.length;
              return monitorlist.slice(start, end);
          };

          var updatePageCount = function(){
              var name = $scope.selected.name.toLowerCase();
              $scope.pageCount = Math.ceil($scope.allRecords[name].length / $scope.pagination.pageSize);
              $scope.pages = [];
              for(var i = 1; i <= $scope.pageCount; i++)  $scope.pages.push(i);
          }

          var updateCurrentData = function(name){
              name = name.toLowerCase();
              var data = $scope.allRecords[name];

              data = data.sort(function(a, b){
                  if(parseInt(a.points) < parseInt(b.points)) return 1;
                  if(parseInt(a.points) > parseInt(b.points)) return -1;
                  return 0;
              });

              $scope.currentData = filterMonitorlist(data);
              updatePageCount();
          };

          $scope.pagination = {
              pageSizes: [5, 10, 25, 50, 100],
              pageSize: 5,
              page: 1,
              finalMonitors: []
          };
          $scope.selected = {};
          $scope.currentData = [];
          $scope.getLeaderboardInsights = function(orgId){
              $scope.$emit('wait:start');
              InsightService.getLeaderboardInsights(orgId)
              .then(function(response){
                  $scope.$emit('wait:stop');
                  $scope.allRecords = response;
                  $scope.dataKeys = _.map(response, function(r, key){
                      var name = key.charAt(0).toUpperCase() + key.slice(1);
                      return {name: name};
                  });
                  if(!$scope.dataKeys || !$scope.dataKeys.length) return false;
                  $scope.selected.name = $scope.dataKeys[0].name;
              })
              .catch(function(){
                  $scope.$emit('wait:stop');
                  $scope.$emit("notification", {
                      type: 'danger',
                      message: "Server error."
                  });
              });
          };

          $scope.pageTurn = function (value) {
              if($scope.pagination.page == 1 && value < 0) return;
              if($scope.pagination.page == $scope.pageCount && value > 0) return;
              $scope.pagination.page = $scope.pagination.page + value;
          };

          $scope.pageTo = function (page) {
              $scope.pagination.page = page;
          };

          $scope.$watch('selected.name', function(name){
              if(!name || !$scope.allRecords) return false;
              name = name.toLowerCase();
              updateCurrentData(name);
          });

          $scope.$watch('pagination.pageSize', function (newValue, oldValue) {
              if(newValue != oldValue) $scope.pagination.page = 1;
              var name = $scope.selected.name;
              if(name) updateCurrentData(name);
          });

          $scope.$watch('pagination.page', function(){
              var name = $scope.selected.name;
              if(name) updateCurrentData(name);
          });

          $scope.$on('loadLeaderboard', function(e, args){
              $scope.getLeaderboardInsights(args.org_id);
          });
      }
  ]);
