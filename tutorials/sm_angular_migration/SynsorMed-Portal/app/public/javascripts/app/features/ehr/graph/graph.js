"use strict";
angular.module('synsormed.features.ehr.graph', [])
.controller('EhrGraphController', ['$scope', '$rootScope', function($scope, $rootScope){
    $scope.$emit('noMenu');
    $rootScope.page = {
        title: "Synsormed: EHR Graphs"
    };
    $scope.monitorMeasurements = [
        {
            "id": 256,
            "measurementId": 6,
            "monitorId": 225,
            "upperbound": "250",
            "lowerbound": "210",
            "sensitivity": 4,
            "next_reading": "2015-11-17T13:27:15.000Z",
            "repeatInterval": 86400,
            "oauthAvailable": true,
            "serviceName": "Fitbit",
            "isOutOfBound": false,
            "isMissed": false,
            "name": "Blood Pressure( Fitbit ) ",
            "unit": null
        },
        {
            "id": 257,
            "measurementId": 2,
            "monitorId": 225,
            "upperbound": "250",
            "lowerbound": "210",
            "sensitivity": 4,
            "next_reading": "2015-11-17T13:27:15.000Z",
            "repeatInterval": 28800,
            "oauthAvailable": true,
            "serviceName": "Fitbit",
            "isOutOfBound": false,
            "isMissed": false,
            "name": "Steps ( Fitbit ) ",
            "unit": null
        },
        {
            "id": 258,
            "measurementId": 3,
            "monitorId": 225,
            "upperbound": "250",
            "lowerbound": "210",
            "sensitivity": 3,
            "next_reading": "2015-11-17T13:27:15.000Z",
            "repeatInterval": 28800,
            "oauthAvailable": true,
            "serviceName": "Withings",
            "isOutOfBound": false,
            "isMissed": false,
            "name": "Weight ( Withings ) ",
            "unit": "lbs"
        },
        {
            "id": 259,
            "measurementId": 1,
            "monitorId": 225,
            "upperbound": "250",
            "lowerbound": "210",
            "sensitivity": 3,
            "next_reading": "2015-11-17T13:27:15.000Z",
            "repeatInterval": 86400,
            "oauthAvailable": true,
            "serviceName": "Ihealth",
            "isOutOfBound": false,
            "isMissed": false,
            "name": "Glucose ( Ihealth ) ",
            "unit": "mg/dL"
        }
    ];
    $scope.selected = {
        id: 256
    };
    $scope.monitor = $scope.monitor = {
        id: 14,
        patientCode: 'ZP4kSE'
    };

    $scope.notification = "";
    $scope.chartSeries = [
        {
            showInLegend: false,
            data: [],
            color: '#F05F3A',
            type: 'line'
        },
        {
            showInLegend: false,
            data: [],
            color: '#007872',
            type: 'line'
        }
    ];
    $scope.xAxis = {
        gridLineWidth: 0,
        labels: { enabled: true, style: {fontWeight: 'bold' } },
        title: { text: null },
        categories: [
            "15 Nov 2015 10:00 AM",
            "16 Nov 2015 5:05 PM",
            "17 Nov 2015 10:04 AM",
            "18 Nov 2015 5:01 PM"
        ]
    };
    $scope.$watch('selected.id', function(){
        switch($scope.selected.id)
        {
            case 256:
            $scope.chartSeries[0].data = [];
            $scope.chartSeries[1].data = [];
            $scope.$emit('wait:start');
            var data = {
                categories: [
                    "15 Nov 2015 10:00 AM",
                    "16 Nov 2015 5:05 PM",
                    "17 Nov 2015 10:04 AM",
                    "18 Nov 2015 5:01 PM"
                ],
                series1: [
                    {
                        'extra': {
                            name: "Blood Pressure (SP)",
                            reading: 110.42,
                            unit: null
                        },
                        'y': 110
                    },
                    {
                        'extra': {
                            name: "Blood Pressure (SP)",
                            reading: 115.83,
                            unit: null
                        },
                        'y': 115
                    },
                    {
                        'extra': {
                            name: "Blood Pressure (SP)",
                            reading: 120.42,
                            unit: null
                        },
                        'y': 120
                    },
                    {
                        'extra': {
                            name: "Blood Pressure (SP)",
                            reading: 125.83,
                            unit: null
                        },
                        'y': 125
                    }
                ],
                series2: [
                    {
                        'extra': {
                            name: "Blood Pressure (DP)",
                            reading: 75.42,
                            unit: null
                        },
                        'y': 75
                    },
                    {
                        'extra': {
                            name: "Blood Pressure (DP)",
                            reading: 80.83,
                            unit: null
                        },
                        'y': 80
                    },
                    {
                        'extra': {
                            name: "Blood Pressure (DP)",
                            reading: 85.42,
                            unit: null
                        },
                        'y': 85
                    },
                    {
                        'extra': {
                            name: "Blood Pressure (DP)",
                            reading: 90.83,
                            unit: null
                        },
                        'y': 90
                    }
                ]
            };
            $scope.notification = false;
            $scope.xAxis.categories = data.categories;
            $scope.chartSeries[0].data = data.series1;
            if(!_.isEmpty(data.series2))
            {
                $scope.chartSeries[1].data = data.series2;
            }
            $scope.$emit('wait:stop');
            break;

            case 257:
            $scope.chartSeries[0].data = [];
            $scope.chartSeries[1].data = [];
            $scope.$emit('wait:start');
            var data = {
                categories: [
                    "15 Nov 2015",
                    "16 Nov 2015",
                    "17 Nov 2015",
                    "18 Nov 2015"
                ],
                series1: [
                    {
                        'extra': {
                            name: "Steps",
                            reading: 70000.42,
                            unit: null
                        },
                        'y': 70000
                    },
                    {
                        'extra': {
                            name: "Steps",
                            reading: 65000.83,
                            unit: null
                        },
                        'y': 65000
                    },
                    {
                        'extra': {
                            name: "Steps",
                            reading: 68000.42,
                            unit: null
                        },
                        'y': 68000
                    },
                    {
                        'extra': {
                            name: "Steps",
                            reading: 70000.83,
                            unit: null
                        },
                        'y': 70000
                    }
                ]
            };
            $scope.notification = false;
            $scope.xAxis.categories = data.categories;
            $scope.chartSeries[0].data = data.series1;
            if(!_.isEmpty(data.series2))
            {
                $scope.chartSeries[1].data = data.series2;
            }
            $scope.$emit('wait:stop');
            break;

            case 258:
            $scope.chartSeries[0].data = [];
            $scope.chartSeries[1].data = [];
            $scope.$emit('wait:start');
            var data = {
                categories: [
                    "15 Nov 2015 11:09 AM",
                    "16 Nov 2015 9:00 PM"
                ],
                series1: [
                    {
                        'extra': {
                            name: "Weight",
                            reading: 198.42,
                            unit: "lbs"
                        },
                        'y': 198
                    },
                    {
                        'extra': {
                            name: "Weight",
                            reading: 202.83,
                            unit: "lbs"
                        },
                        'y': 202
                    }
                ]
            };
            $scope.notification = false;
            $scope.xAxis.categories = data.categories;
            $scope.chartSeries[0].data = data.series1;
            if(!_.isEmpty(data.series2))
            {
                $scope.chartSeries[1].data = data.series2;
            }
            $scope.$emit('wait:stop');
            break;

            case 259:
            $scope.chartSeries[0].data = [];
            $scope.chartSeries[1].data = [];
            $scope.$emit('wait:start');
            var data = {
                categories: [
                    "15 Nov 2015 10:04 AM",
                    "16 Nov 2015 11:12 AM",
                    "17 Nov 2015 1:09 PM",
                    "18 Nov 2015 5:12 PM"
                ],
                series1: [
                    {
                        'extra': {
                            name: "Glucose",
                            reading: 140.42,
                            unit: "mg/dL"
                        },
                        'y': 140
                    },
                    {
                        'extra': {
                            name: "Glucose",
                            reading: 139.83,
                            unit: "mg/dL"
                        },
                        'y': 139
                    },
                    {
                        'extra': {
                            name: "Glucose",
                            reading: 135,
                            unit: "mg/dL"
                        },
                        'y': 135
                    },
                    {
                        'extra': {
                            name: "Glucose",
                            reading: 140.00,
                            unit: "mg/dL"
                        },
                        'y': 140
                    }
                ]
            };
            $scope.notification = false;
            $scope.xAxis.categories = data.categories;
            $scope.chartSeries[0].data = data.series1;
            if(!_.isEmpty(data.series2))
            {
                $scope.chartSeries[1].data = data.series2;
            }
            $scope.$emit('wait:stop');
            break;
        }
    });

    $scope.chartConfig = {
        options: {
            chart: {
                type: 'line',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
            },
            plotOptions: {
                column: {
                    states: {
                        hover:
                        {
                            color: {
                                linearGradient: {x1: 0, y1: 1, x2: 0, y2: 0},
                                stops: [
                                    [0, '#F05F3A'],
                                    [1, '#EF3809']
                                ]
                            }
                        }
                    },
                    color: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, '#00918a'],
                            [1, '#00ABA2']
                        ]
                    }
                }
            },
            tooltip: {
                borderWidth: 0,
                useHTML: true,
                backgroundColor: '#FFFFFF',
                formatter: function() {
                    var unit = this.point.extra.unit != null ?
                    "<tr><td><b>Unit</b></td><td>" + this.point.extra.unit + "</td></tr>" :
                    "";
                    return '<table class="text-left table-condensed">' +
                    '<tr><td><b>Indicator</b></td><td>' + _.capitalize(this.point.extra.name) + '</td></tr>' +
                    unit +
                    '<tr><td><b>Reading</b></td><td>' + this.point.extra.reading + '</td></tr>' +
                    '</table>';
                }
            },
            yAxis: {
                //commented for line charts
                //gridLineWidth: 0,
                //labels: {enabled: false },
                title: {text: null }
            },
            xAxis: $scope.xAxis,
            series: $scope.chartSeries
        },
        series: $scope.chartSeries,
        title: {text: null},
        credits: {enabled: false},
        loading: false,
        xAxis: $scope.xAxis
    };
    $scope.$on("$destroy", function() {
        $scope.$emit('showMenu');
    });
}
]);
