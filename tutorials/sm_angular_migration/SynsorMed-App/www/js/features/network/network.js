angular.module('synsormed.controllers.network', [
    'highcharts-ng',
    'synsormed.services.user'
]).controller('networkController', [
    '$scope',
    'synsormed.components.network2.NetworkAnalysisService',
    'synsormed.components.network2.NetworkGrade',
    'synsormed.components.network2.NetworkBackgroundScanService',
    '$location',
    'repeater',
    'synsormed.services.user.UserService',
    function ($scope, NetworkAnalysisService, NetworkGrade, NetworkBackgroundScanService, $location, repeater, UserService) {

        //current score
        $scope.score = [{ data: [0] }];

        //if test has run , used for showing error messages
        $scope.testRun = false;
        $scope.$emit('network:scan:stop');

        $scope.scoreLevel = function () {
            return $scope.score[0].data;
        };

        $scope.testSpeed = function () {
            $scope.testRun = false;
            $scope.score[0].data = [0];
            $scope.$emit('wait:start');

            repeater(NetworkAnalysisService.deep, 2, 1000).then(function (data) {
                var score = NetworkGrade(data.speed / 1024, data.latency);

                UserService.setNetworkGrade(score); // store network grade for further use

                $scope.$emit('wait:stop');
                $scope.score[0].data = [score];
                $scope.testRun = true;

                //set to high bandwidth
                NetworkBackgroundScanService.setNetworkGrade(score);

            }).catch(function (err) {

                $scope.$emit('wait:stop');
                $scope.$emit('notification:error', "Network Scan Failed");

                $scope.score[0].data = [0];
                $scope.testRun = true;
                //set to lowest bandwidth
                NetworkBackgroundScanService.setNetworkGrade(0);

            });
        };

        //show login screen
        $scope.showLoginPage = function () {
            //start scanning the network in background
            $scope.$emit('network:scan:start');
            //$location.path('/login');
            $location.path('/login/patient');
        };

        $scope.chartConfig = {
            options: {
                chart: {
                    type: 'solidgauge',
                    backgroundColor: 'rgba(255, 255, 255, 0.0)',
                },
                pane: {
                    center: ['50%', '50%'],
                    size: '100%',
                    startAngle: -90,
                    endAngle: 90,
                    background: {
                        backgroundColor: '#EEE',
                        innerRadius: '60%',
                        outerRadius: '100%',
                        shape: 'arc'
                    }
                },
                plotOptions: {
                    solidgauge: {
                        dataLabels: {
                            y: -25,
                            borderWidth: 0,
                            useHTML: true,
                            format: '<div style="text-align:center"><span style="font-size:25px;color:black">{y}</span><br/>' +
                                '<span style="font-size:12px;color:grey">Grade Points</span></div>'
                        }
                    }
                },
                tooltip: { enabled: false },
                series: $scope.speed,
                credits: { enabled: false },
            },
            series: $scope.score,
            title: {
                text: 'Network Speed',
                y: 10
            },

            yAxis: {
                currentMin: 0,
                currentMax: 10,
                stops: [
                    [0.2, '#DF5353'], // red
                    [0.4, '#F58B13'], // ornage
                    [0.6, '#DDDF0D'], // yellow
                    [0.8, '#55BF3B'] // green
                ],
                lineWidth: 0,
                tickInterval: 2.5,
                minorTickInterval: null,
                tickPixelInterval: 2.5,
                tickWidth: 0,
                labels: {
                    y: 15
                }
            },
            loading: false
        };

        $scope.init = function () {
            $scope.testSpeed();
        }

    }
]);
