"use strict";
angular.module('synsormed.features.provider.monitor.insights', [])
    .controller('MonitorInsightsController', [
        '$scope',
        '$location',
        '$modal',
        '$modalInstance',
        'monitor',
        'monitorMeasurements',
        'synsormed.services.MonitorService',
        'measurements',
        '$timeout',
        'statusSurvey',
        function ($scope, $location, $modal, $modalInstance, monitor, monitorMeasurements, MonitorService, measurements, $timeout, statusSurvey) {
            $scope.selected = {
                id: monitorMeasurements[0].id,
                date: null
            }
            $scope.monitor = monitor;
            $scope.lastSyncTime = 'not available';
            $scope.extraSeries = [];
            $scope.extraGraphs = false;
            //$scope.selected.graph = 'default';
            $scope.selected.graph = 'status';
            $scope.selected.alertDate = 'Default';

            var checkMeasurement = function (monitorId, measurementArray) {
                var response = false;
                var measurementId = false;

                _.forEach(monitorMeasurements, function (monitor) {
                    if (monitor.id == monitorId) {
                        measurementId = monitor.measurementId;
                        return;
                    }
                });

                _.forEach(measurements, function (measurement) {
                    var measurementName = measurement.name.toLowerCase();
                    if ((measurementArray.indexOf(measurementName) != -1) && measurement.id == measurementId) {
                        response = true;
                    }
                });

                return response;
            };

            $scope.checkMeasurementForDropDown = function (monitorId) {
                $scope.isHeartBeatMeasurement = checkMeasurement(monitorId, ['heartrate', 'breath', 'oxygen flow']);
                return $scope.isHeartBeatMeasurement;
            };

            $scope.checkOxygenFlowMeasurement = function (monitorId) {
                $scope.isOxygenMeasurement = checkMeasurement(monitorId, ['oxygen flow']);
                return $scope.isOxygenMeasurement;
            };

            $scope.monitorMeasurements = _.map(monitorMeasurements, function (measurement) {
                measurement.name = measurement.display_name ? measurement.display_name : measurement.name;
                if (measurement.serviceName) {
                    //measurement.name += ' ( ' + measurement.serviceName + ' ) ';
                    measurement.name = measurement.serviceName.toLowerCase() == 'c5' ? 'Companion 5' : measurement.serviceName;
                }
                return measurement;
            });
            $scope.monitorMeasurements = _.uniq($scope.monitorMeasurements, function (measurement) {
                return measurement.measurementId + measurement.serviceName;
            });
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
                labels: { enabled: true, style: { fontWeight: 'bold' } },
                title: { text: null },
                categories: []
            };

            $scope.yAxis = [{
                allowDecimals: false,
                labels: {
                    format: '{value}'
                },
                title: { text: null },
                stackLabels: {
                    enabled: true
                }
            }, {
                allowDecimals: false,
                labels: {
                    format: '{value}'
                },
                title: { text: null },
                opposite: true
            }];

            $scope.$watch('selected.date', function (newSelectedDate) {
                if (newSelectedDate) {
                    _.forEach($scope.dateCategories, function (category) {
                        if (category.text == newSelectedDate) {
                            $scope.xAxis.categories = category.date;
                            $scope.chartSeries[0].data = category.data;
                        }
                    });
                }
            });

            $scope.$watch('selected.alertDate', function (newSelectedDate) {
                if (newSelectedDate && newSelectedDate !== 'Default') {
                    _.forEach($scope.alertDateCategories, function (category) {
                        if (category.text == newSelectedDate) {
                            resetChart();
                            $scope.xAxis.categories = category.catgories;
                            $scope.chartSeries[0].data = category.data;
                            $scope.chartSeries[0].color = (category.config && category.config.color) ? category.config.color : $scope.chartSeries[0].color;
                            if (category.type)
                                $scope.chartSeries[0].type = category.type;
                            else
                                $scope.chartSeries[0].type = 'line';
                        }
                    });
                }
                else {
                    plotExtraGraphs();
                }
            });

            $scope.$watch('selected.graph', function (newValue) {
                if (newValue == 'default') {
                    showXaxis();
                    getData($scope.selectedDays);
                    //plotFlowGraph($scope.selected.flowDate);
                }
                else {
                    showXaxis();
                    getData($scope.selectedDays);
                    //plotExtraGraphs();
                }
            });

            var hideXaxis = function () {
                $scope.chartConfig.xAxis.labels.enabled = false;
                $scope.chartConfig.options.xAxis.labels.enabled = false;
            };

            var showXaxis = function () {
                $scope.chartConfig.xAxis.labels.enabled = true;
                $scope.chartConfig.options.xAxis.labels.enabled = true;
            };

            var getLocalDates = function (categories) {
                var localDates = [];

                var re = /^\d{1,2}\s.{3}\s\d{4}$/;
                if (re.test(categories[0])) {
                    categories.forEach(function (date) {
                        localDates.push(date);
                    });
                }
                else {
                    categories.forEach(function (date) {
                        localDates.push(moment(date, 'YYYY-MM-DDTHH:mm:ss.sssZ').format('D MMM YYYY h:mm A'));
                    });
                }

                return localDates;
            };

            var setUpFlowGraph = function (localDates) {
                if (!$scope.allSeries) return;

                var catgories = [{ text: 'Default' }];

                var findCatagoryKey = function (key) {
                    var response = catgories.length;
                    _.forEach(catgories, function (val, ind) {
                        return val.text == key ? response = ind : true;
                    });
                    return response;
                };

                _.forEach(localDates, function (date, ind) {
                    var dateObj = moment(date, 'D MMM YYYY HH:mm:ss');
                    var text = dateObj.format('D') + " " + moment.monthsShort()[dateObj.format('M') - 1] + " " + dateObj.format('YYYY');
                    var key = findCatagoryKey(text);
                    catgories[key] = catgories[key] || {};
                    catgories[key].text = text;
                });

                $scope.flowCategories = catgories;
                plotFlowGraph('Default');
                $scope.selected.flowDate = catgories[0].text;
            };

            var plotFlowGraph = function (date) {
                if (!date) return;
                if (date == 'Default') return plotExtraGraphs();
                resetChart();
                var allSeries = $scope.allSeries;
                var allLocalDates = $scope.allLocalDates;
                $scope.notification = false;
                _.forEach(allSeries, function (series, ind) {
                    var data = [];
                    var dates = [];
                    _.forEach(allLocalDates, function (temp, ind) {
                        var dateObj = moment(temp, 'D MMM YYYY HH:mm:ss');
                        var text = dateObj.format('D') + " " + moment.monthsShort()[dateObj.format('M') - 1] + " " + dateObj.format('YYYY');

                        if (text == date) {
                            data.push(series.data[ind]);
                            dates.push(temp);
                        }
                    });
                    $scope.xAxis.categories = dates;
                    $scope.chartSeries[ind].data = data;
                    $scope.chartSeries[ind].color = (series.config && series.config.color) ? series.config.color : $scope.chartSeries[ind].color;

                    if (series.yAxis)
                        $scope.chartSeries[ind].yAxis = series.yAxis;
                    else
                        delete ($scope.chartSeries[ind].yAxis);

                    if (series.type)
                        $scope.chartSeries[ind].type = series.type;
                    else
                        $scope.chartSeries[ind].type = 'line';
                });
            };

            var getSurveyName = function () {
                var res = false;
                var monitorId = $scope.selected.id;
                var selectedSurveyId = null;
                _.forEach(monitorMeasurements, function (monitor) {
                    if (monitor.id == monitorId) {
                        res = statusSurvey.find(function (survey) {
                            return survey.id == monitor.statusSurveyId;
                        });
                    }
                });
                return (res ? res.displayName : res);
            };

            var getMeasurementIdFromMonitorId = function (monitorId) {
                var measurementId = null;
                _.forEach(monitorMeasurements, function (monitor) {
                    if (monitor.id == monitorId) {
                        measurementId = monitor.measurementId;
                        return;
                    }
                });
                return measurementId;
            };

            var checkMeasurementWithId = function (monitorId, measurementNames) {
                var response = false;
                var measurementId = getMeasurementIdFromMonitorId(monitorId);
                measurementNames = measurementNames ? measurementNames : [];
                _.forEach(measurements, function (measurement) {
                    var measurementName = measurement.name.toLowerCase();
                    if ((measurementNames.indexOf(measurementName) != -1) && measurement.id == measurementId) response = true;
                });
                return response;
            };

            $scope.$watch('selected.flowDate', function (date) {
                if (date) {
                    plotFlowGraph(date);
                }
            });

            var lastSyncFormattedDate;

            var getData = function (days, firstDate, secondDate) {
                if (days == 'custom' && !secondDate) {
                    return;
                }
                $scope.$emit('wait:start');
                MonitorService
                    .getMonitorInsights(monitor.id, $scope.selected.id, days, firstDate, secondDate)
                    .then(function (data) {
                        /*****
                        11/14/18-Amin.  Not applicable because we don't currently use caire devices on SM-Prime
                        ******/
                        // if (data.extraSeries && data.extraSeries.latestDates) {
                        //     $scope.latestDates = data.extraSeries.latestDates;

                        //     //Modify names and remove some based on customer feedback
                        //     var tempLatestDates = {};
                        //     _.forEach($scope.latestDates, function (value, index) {
                        //         if (index == "Under 85") {
                        //             tempLatestDates['Low Oxygen Levels'] = value;
                        //         } else if (index == "Low Flow Rate") {
                        //             tempLatestDates['Low Flowrate (below 1/4 LPM)'] = value;
                        //         } else if (index == "Ambient Pressure") {
                        //             tempLatestDates['Ambient Pressure Sensor Failure'] = value;
                        //         } else if (index == "EEPROM") {
                        //             tempLatestDates['Fail Circuit Board'] = value;
                        //         } else if (index == "High Flow Rate") {
                        //             tempLatestDates['High Flowrate (over 6 LPM)'] = value;
                        //         } else if (index != "Under 70") {
                        //             tempLatestDates[index] = value;
                        //         }
                        //     });
                        //     $scope.latestDates = tempLatestDates;

                        //     var allAlertsDate = [];

                        //     _.forEach($scope.latestDates, function (date, alert) {
                        //         if (alert.toLowerCase() != 'cleared' && date) {
                        //             allAlertsDate.push(date);
                        //             var sorted = allAlertsDate.slice()
                        //                 .sort(function (a, b) {
                        //                     return new Date(a) - new Date(b);
                        //                 });
                        //             $scope.latestAlertDate = moment(new Date(sorted.pop())).format('D MMM YYYY hh:mm A');
                        //             //  allAlertsDate.push(new Date(date));
                        //             //  var alertDate = new Date(Math.max.apply(null,allAlertsDate));
                        //             //  $scope.latestAlertDate = moment(alertDate).format('DD MMM YYYY');
                        //         }
                        //     });

                        // }

                        lastSyncFormattedDate = data.lastSyncTime;

                        $scope.lastSyncTime = data.lastSyncTime ? moment(new Date(data.lastSyncTime)).format('MMM-DD-YYYY hh:mm A') : 'not available';

                        $scope.extraGraphs = data.extraSeries ? data.extraSeries : false;
                        $scope.extraCategories = data.extraCategories ? data.extraCategories : false;
                        $scope.flowCategoriesDate = data.categories ? data.categories : false;

                        if ($scope.extraGraphs) {
                            if (_.isEmpty($scope.extraSeries)) {
                                //$scope.extraSeries.push({key:'default', name:'Flow Rate'});
                                _.forEach($scope.extraGraphs, function (value, index) {
                                    //if(index != 'latestDates'){
                                    if (value && value[0].data && value[0].data.length) {
                                        $scope.extraSeries.push({ key: index, name: index == 'hours' ? 'Usage' : index.charAt(0).toUpperCase() + index.slice(1) });
                                    }
                                });
                            }

                            $scope.extraGraphs.orignalSeries = data.series;
                            $scope.extraGraphs.categories = data.categories;
                        }

                        if (data.categories) {
                            var localDates = getLocalDates(data.categories);

                            $scope.notification = $scope.dateCategories = $scope.selected.date = false;

                            data.series = _.filter(data.series, function (series) {
                                return series.data.length;
                            });

                            if ($scope.isOxygenMeasurement) {
                                $scope.allLocalDates = localDates;
                                $scope.allSeries = data.series;
                                $scope.$emit('wait:stop');
                                $scope.xAxis.categories = localDates;
                                return setUpFlowGraph(localDates);
                            }

                            if (checkMeasurementWithId($scope.selected.id, ['status'])) {
                                if ($scope.selected.graph == 'steps') {
                                    var stepDates = [];
                                    $scope.chartConfig.series = $scope.extraGraphs.steps;
                                    _.forEach($scope.extraGraphs.steps[0].data, function (data) {
                                        stepDates.push(moment(data.extra.date, 'YYYY-MM-DDTHH:mm:ss.sssZ').format('D MMM YYYY h:mm A'));
                                    })
                                    $scope.xAxis.categories = stepDates;
                                    $scope.chartSeries[0].showInLegend = true;
                                    $scope.chartSeries[0].name = 'steps';
                                }
                                else if ($scope.selected.graph == 'status') {
                                    data.series.forEach(function (series, ind) {

                                        var questions = [];
                                        var isAllInt = true;
                                        $scope.series = series.data;

                                        _.forEach($scope.series, function (question, index) {
                                            var cat = moment(question.extra.date, 'YYYY-MM-DDTHH:mm:ss.sssZ').format('D MMM YYYY h:mm:ss A');

                                            question.extra.options.forEach(function (option) {
                                                if (isNaN(option)) isAllInt = false;
                                            });

                                            var prevAvailable = _.find(questions, function (storedQ) {
                                                return storedQ.questionId == question.extra.id;
                                            });

                                            if (!prevAvailable) {
                                                questions.push({
                                                    questionId: question.extra.id,
                                                    data: [question],
                                                    categories: [cat],
                                                    options: question.extra.options,
                                                    text: 'Q#' + (Object.keys(questions).length + 1)
                                                });
                                            }
                                            else {
                                                prevAvailable.data.push(question);
                                                prevAvailable.categories.push(cat);
                                            }
                                        });

                                        if (isAllInt) {
                                            var surveyName = getSurveyName();
                                            var defaultTotal = {
                                                text: surveyName,
                                                categories: [],
                                                data: [],
                                                options: [surveyName]
                                            };
                                            var questionC = _.cloneDeep(questions);
                                            var questionsDateObj = {};
                                            var questionsDateArr = [];

                                            questionC.forEach(function (question) {
                                                question.data.forEach(function (dataChunk, ind) {
                                                    var questionsDate = moment(dataChunk.extra.date, 'YYYY-MM-DDTHH:mm:ss.sssZ').format('D MMM YYYY hh:mm:ss A');
                                                    questionsDateObj[ind] = questionsDateObj[ind] || [];
                                                    questionsDateObj[ind] = questionsDate;
                                                    if (defaultTotal.data[ind]) {
                                                        var sum = defaultTotal.data[ind].y + parseInt(dataChunk.y);
                                                        defaultTotal.data[ind].y = sum;
                                                        defaultTotal.data[ind].extra.answer = sum;
                                                        defaultTotal.data[ind].extra.question = surveyName;
                                                        defaultTotal.data[ind].extra.date = dataChunk.extra.date;
                                                    }
                                                    else {
                                                        dataChunk.y = parseInt(dataChunk.y);
                                                        defaultTotal.data[ind] = dataChunk;
                                                    }
                                                });
                                            });
                                            _.forEach(questionsDateObj, function (date) {
                                                questionsDateArr.push(date);
                                            })
                                            defaultTotal.categories = questionsDateArr;
                                            questions = [defaultTotal];
                                        }
                                        $scope.chartSeries[0].data = questions[0].data;
                                        $scope.xAxis.categories = questions[0].categories;
                                        $scope.chartConfig.series = questions;

                                        $scope.questionCategories = questions;
                                        $scope.selected.question = questions[0].text;
                                        $scope.chartSeries[ind].color = (series.config && series.config.color) ? series.config.color : $scope.chartSeries[ind].color;
                                    });
                                }
                                $scope.chartConfig.options.legend = { enabled: false }
                                $scope.chartConfig.options.plotOptions.series.color = 'rgb(0, 120, 114)';
                                $scope.chartConfig.options.plotOptions.series.marker = { symbol: 'circle' };
                            }

                            data.series.forEach(function (series, ind) {
                                if ($scope.isHeartBeatMeasurement) {
                                    setDateCategories(localDates, series);
                                }
                                else if (checkMeasurementWithId($scope.selected.id, ['oxygen saturation', 'weight', 'temperature'])) {
                                    $scope.xAxis.categories = localDates;
                                    $scope.chartSeries[ind].data = series.data;
                                    $scope.chartSeries[ind].color = (series.config && series.config.color) ? series.config.color : $scope.chartSeries[ind].color;

                                    if (series.yAxis)
                                        $scope.chartSeries[ind].yAxis = series.yAxis;
                                    else
                                        delete ($scope.chartSeries[ind].yAxis);

                                    if (series.type)
                                        $scope.chartSeries[ind].type = series.type;
                                    else
                                        $scope.chartSeries[ind].type = 'line';
                                }
                            });
                            $scope.$emit('wait:stop');
                        }

                        if (days === 365 && $scope.selected.graph == 'status') {
                            $scope.xAxis.categories = _.map(_.range(0, 12), function(_1, month) {
                                return moment().subtract(11 - month, 'month').format('MMM YYYY');
                            });

                            var tempData = _.map(_.range(0, 12), function(_1, month) {
                                var formattedMonth = moment().subtract(11 - month, 'month').format('MMM YYYY');
                                var items = _.filter($scope.chartSeries[0].data, function(item) {
                                    return moment(item.extra.date).format('MMM YYYY') === formattedMonth;
                                });
                                var avg = Math.round(_.reduce(items, function(sum, item) {
                                    return sum + item.y;
                                }, 0) / items.length);

                                return {
                                    y: isNaN(avg) ? 0 : avg,
                                    extra: {
                                        clickable: false,
                                        name: 'Status',
                                        month: formattedMonth
                                    }
                                };
                            });

                            $scope.chartConfig.series[0].categories = $scope.xAxis.categories;
                            $scope.chartConfig.series[0].data = tempData;
                        }
                        setChartTitle();
                    })
                    .catch(function (error) {
                        var lastSyncTime = error.headers('X-SynsorMed-Last-Sync-Time');
                        $scope.lastSyncTime = (lastSyncTime && lastSyncTime != 'false') ? moment(new Date(lastSyncTime)).format('MMM-DD-YYYY') : 'not available';
                        $scope.chartSeries.forEach(function (val, ind) {
                            $scope.chartSeries[ind].data = [];
                        });
                        $scope.dateCategories = false;
                        $scope.selected.date = false;
                        if (error.status === 409) {
                            $scope.notification = error.data || 'Service has no readings submitted in these last 30 days for the current measurement';
                        }
                        else if (error.status === 404) {
                            $scope.notification = 'No service linked';
                        }
                        else {
                            $scope.notification = 'No readings available';
                        }
                        $scope.$emit('wait:stop');
                    });
            }


            $scope.$watch('selected.id', function (value) {
                $scope.showDates = false;
                _.forEach($scope.monitorMeasurements, function (measurement) {
                    //if (value == measurement.id && measurement.serviceName && (measurement.serviceName.toLowerCase() == 'c5' || measurement.serviceName.toLowerCase() == 'survey')) {
                    if (value == measurement.id && measurement.serviceName) {
                        $scope.showDates = true;
                        $scope.selectedDays = $scope.selectedDays || 7;
                        display7thButton();
                        setDeviceName();
                    }
                    if (value == measurement.id && measurement.serviceName) {
                        $scope.selectedServiceName = measurement.serviceName;
                    }
                });

                resetChart();
                showXaxis();
                $scope.extraSeries = [];
                //$scope.selected.graph = 'default';
                $scope.selected.graph = 'status';
                $scope.extraGraphs = false;

                //$scope.$emit('wait:start');
                getData($scope.selectedDays);
            });
            $scope.ok = function () {
                //$scope.$emit('wait:stop');
                $modalInstance.dismiss('cancel');
            };

            var setChartTitle = function () {
                if ($scope.chartConfig) {
                    $scope.chartConfig.title.text = getFileName();
                    $scope.chartConfig.subtitle.text = null;
                }
            };
            var setDeviceName = function () {
                $scope.chartConfig.title.text = "Loading...";

            }
            var setTimeText = function (days) {
                if (days == 30) {
                    $scope.chartConfig.title.text = $scope.chartConfig.title.text + " " + "(Month)";
                } else if (days == 1) {
                    $scope.chartConfig.title.text = $scope.chartConfig.title.text + " " + "(Day)";
                } else if (days == 7) {
                    $scope.chartConfig.title.text = $scope.chartConfig.title.text + " " + "(Week)";
                } else if (days == 365) {
                    $scope.chartConfig.title.text = $scope.chartConfig.title.text + " " + "(Year)";
                } else {
                    $scope.chartConfig.title.text = $scope.chartConfig.title.text + " " + "(Custom)";
                }
            }
            var setTitleText = function (days) {

                var dayLabel = null;

                switch (days) {
                    case 30:
                        dayLabel = "Month";
                        break;
                    case 1:
                        dayLabel = "Day";
                        break;
                    case 7:
                        dayLabel = "Week";
                        break;
                    case 365:
                        dayLabel = "Year";
                        break;
                    default:
                        dayLabel = "Custom";
                }

                if ($scope.monitorMeasurements && $scope.monitorMeasurements.length) {
                    $scope.monitorMeasurements.forEach(function (measurement) {
                        if (measurement.id == $scope.selected.id) {
                            //if($scope.title){
                            //  measurement.display_name=$scope.chartConfig.title.text + $scope.title;
                            //}
                            $scope.chartConfig.title.text = "Type: " + $scope.title + " | Device: " + $scope.selectedServiceName + " | Name: " + ($scope.monitor.patientName ? $scope.monitor.patientName : 'None');
                            //$scope.chartConfig.title.text =(measurement.display_name ? measurement.display_name : measurement.name) + '-' + $scope.monitor.patientCode + ' ('+ $scope.selectedServiceName +') '+($scope.monitor.patientName ? $scope.monitor.patientName : 'N/A');
                            $scope.chartConfig.subtitle.text = "Range: " + dayLabel + " | Code: " + $scope.monitor.patientCode;
                            //$scope.chartConfig.yAxis[0].title.text = $scope.chartConfig.series[0].data[0].extra.unit;

                        }
                    });
                }
            }

            var resetChart = function () {
                $scope.chartConfig.options.chart.type = 'line';
                $scope.chartConfig.series = $scope.chartSeries;
                $scope.chartSeries[0].data = [];
                $scope.chartSeries[1].data = [];
            };

            var getFileName = function () {
                var filename = 'patient-chart';
                if ($scope.monitorMeasurements && $scope.monitorMeasurements.length) {
                    $scope.monitorMeasurements.forEach(function (measurement) {
                        if (measurement.id == $scope.selected.id) {
                            filename = measurement.name + '-' + $scope.monitor.patientCode;
                            filename.replace(/ /g, '')
                        }
                        if (measurement.id == $scope.selected.id && (measurement.name.toLowerCase() == 'companion 5' || measurement.name.toLowerCase() == 'eclipse')) {
                            filename = $scope.title;
                        }
                    });
                }
                return filename;
            };

            var setDateCategories = function (localDates, series) {
                var catgories = [];

                var findCatagoryKey = function (key) {
                    var response = catgories.length;
                    _.forEach(catgories, function (val, ind) {
                        return val.text == key ? response = ind : true;
                    });
                    return response;
                };

                _.forEach(localDates, function (date, ind) {
                    var dateObj = moment(date, 'D MMM YYYY HH:mm:ss');
                    var text = dateObj.format('D') + " " + moment.monthsShort()[dateObj.format('M') - 1] + " " + dateObj.format('YYYY');
                    var key = findCatagoryKey(text);
                    catgories[key] = catgories[key] || { date: [], data: [] };
                    catgories[key].date.push(date);
                    catgories[key].data.push(series.data[ind]);
                    catgories[key].text = text;
                });

                $scope.dateCategories = catgories;
                $scope.selected.date = catgories[0].text;
            };

            var plotExtraGraphs = function () {
                if ($scope.extraGraphs) {
                    resetChart();
                    //$scope.$emit('wait:start');
                    if ($scope.selected.graph == 'default') {
                        $scope.title = 'Flow Rate';
                    }
                    else if ($scope.selected.graph == 'hours') {
                        $scope.title = 'Usage Hours';
                    }
                    else if ($scope.selected.graph == 'alarms') {
                        $scope.title = 'Alarms';
                    }
                    var seriesToShow = ($scope.selected.graph == 'default') ? $scope.extraGraphs.orignalSeries : $scope.extraGraphs[$scope.selected.graph];
                    var categories = $scope.extraGraphs.categories ? $scope.extraGraphs.categories : [];
                    var localDates = getLocalDates(categories);

                    var summarizeUsage = function (data) {
                        var datesArray = [];

                        //Get an array of all dates
                        _.forEach(data, function (dataPoint, index) {
                            datesArray[index] = dataPoint.extra.date;

                        });

                        return data;
                    };

                    $scope.getStatusClass = function (alertName, date) {
                        if (!date) return 'status-green';
                        var alerDate = new Date(date);
                        var lastSyn = new Date(lastSyncFormattedDate);
                        //var lastSyn = moment(new Date(lastSyncFormattedDate)).hour(0).minute(0).second(0);

                        var cleared = false;
                        if ($scope.latestDates['Cleared'] && date < $scope.latestDates['Cleared']) {
                            cleared = new Date($scope.latestDates['Cleared']);
                        }

                        if (alerDate.getDate() == lastSyn.getDate() && alerDate.getMonth() == lastSyn.getMonth() && alerDate.getFullYear() == lastSyn.getFullYear() && !cleared) {
                            return 'status-red';
                        }
                        else {
                            return 'status-green';
                        }
                        // if(alerDate.isSame(lastSyn) && !lastSyn.isSame(cleared) ){
                        //    return 'status-red';
                        // }
                        // else {
                        //    return 'status-green';
                        // }
                    };

                    $scope.showAlertDates = function (alertName) {
                        var showToolTip = false;
                        _.forEach($scope.alertNames, function (result) {
                            if (result == alertName) {
                                showToolTip = true;
                            }
                        });
                        if (showToolTip) {
                            return '<div style="width:80px"> ' + $scope.lastSyncTime + '</div>';
                        }
                    };

                    $scope.notification = $scope.dateCategories = $scope.selected.date = false;

                    _.forEach(seriesToShow, function (alarmsData) {
                        _.forEach(alarmsData.data, function (data, ind) {
                            if ((data && data.name == 'Cleared')) {
                                data = alarmsData.data.splice(ind, 1);
                            }
                            // if(!data){
                            //   data = alarmsData.data.splice(alarmsData.data.length - 1, 1);
                            // }
                        });
                    });

                    seriesToShow = _.filter(seriesToShow, function (series) {
                        return series.data.length;
                    });

                    if ($scope.selected.graph == 'alarms') {
                        $scope.chartConfig.options.legend = { enabled: false }
                        var alertCategories = $scope.extraCategories ? getLocalDates($scope.extraCategories.alarms) : localDates;
                        $scope.notification = (!alertCategories || !alertCategories.length) ? 'No alarms found' : false;
                        $scope.chartConfig.options.chart.type = 'column';
                        //$scope.xAxis.categories = alertCategories;
                        $scope.xAxis.categories = [];
                        $scope.chartConfig.series = seriesToShow;

                        var catgories = [], catgoriesDropdown = [{ text: 'Default' }];

                        var findCatagoryKey = function (key) {
                            var response = catgories.length;
                            _.forEach(catgories, function (val, ind) {
                                return val.text == key ? response = ind : true;
                            });
                            return response;
                        };

                        var alertCat = [];
                        _.forEach(seriesToShow, function (alert) {
                            alertCat.push(alert.name);
                        });

                        _.forEach(alertCategories, function (date, ind) {
                            var dateObj = moment(date, 'D MMM YYYY HH:mm:ss');
                            var text = dateObj.format('D') + " " + moment.monthsShort()[dateObj.format('M') - 1] + " " + dateObj.format('YYYY');
                            var key = findCatagoryKey(text);
                            var tmpData = [];
                            _.forEach(seriesToShow, function (alert) {
                                if (alert.data[ind])
                                    tmpData.push(alert.data[ind]);
                            });

                            catgories[key] = catgories[key] || { date: [], data: [] };
                            catgories[key].catgories = alertCat;
                            if (tmpData.length)
                                catgories[key].data = tmpData;
                            catgories[key].type = 'column';
                            catgories[key].config = {};
                            catgories[key].text = text;
                            if (!_.find(catgoriesDropdown, { text: text }))
                                catgoriesDropdown.push({ text: text });
                        });

                        $scope.alertDateCategories = catgories;
                        $scope.alertDateCategoriesDropdown = catgoriesDropdown;
                    }
                    else {
                        seriesToShow.forEach(function (series, ind) {
                            $scope.chartSeries[ind].showInLegend = false;
                            if ($scope.selected.graph == 'hours') {
                                $scope.chartConfig.options.legend = { enabled: true }
                                var hourCategoriesDate = [];
                                var hourCategories = $scope.extraCategories ? getLocalDates($scope.extraCategories.hours) : localDates;
                                _.forEach(hourCategories, function (date) {
                                    var formattedDate = moment(date).format('MM/DD/YYYY');
                                    hourCategoriesDate.push(formattedDate);
                                })
                                $scope.xAxis.categories = hourCategoriesDate;
                                //hideXaxis();
                                series.data = summarizeUsage(series.data);
                                $scope.chartSeries[ind].showInLegend = true;
                                $scope.chartSeries[ind].name = series.data[0].name;
                            }
                            else if ($scope.selected.graph == 'default') {
                                //hideXaxis();
                                var flowDatesArray = [];
                                if ($scope.flowCategoriesDate) {
                                    _.forEach($scope.flowCategoriesDate, function (date) {
                                        var formattedDate = moment(date).format('DD MMM YYYY');
                                        flowDatesArray.push(formattedDate);
                                    })
                                    $scope.xAxis.categories = flowDatesArray;
                                }
                            }
                            else {
                                $scope.xAxis.categories = localDates;
                            }

                            $scope.chartSeries[ind].data = series.data;
                            $scope.chartSeries[ind].color = (series.config && series.config.color) ? series.config.color : $scope.chartSeries[ind].color;
                            if (series.yAxis && $scope.yAxis.length > 1)
                                $scope.chartSeries[ind].yAxis = series.yAxis;
                            else
                                delete ($scope.chartSeries[ind].yAxis);

                            if (series.type)
                                $scope.chartSeries[ind].type = series.type;
                            else
                                $scope.chartSeries[ind].type = 'line';
                        });
                    }

                    $scope.chartConfig.yAxis[0].title.text = $scope.chartConfig.series[0] ? $scope.chartConfig.series[0].data[0].extra.unit : null; //Set the yaxis label before displaying data
                    $scope.$emit('wait:stop');
                    setChartTitle();
                }
            }
            $scope.dayActive = true;
            $scope.weekActive = false;
            $scope.monthActive = false;
            $scope.yearActive = false;
            $scope.customActive = false;

            var display7thButton = function () {
                $scope.dayActive = false;
                $scope.weekActive = true;
                $scope.monthActive = false;
                $scope.yearActive = false;
                $scope.customActive = false;
                $scope.showDatePickers = false;
            };

            $scope.getDataAccTime = function (days) {
                $scope.selectedDays = days;
                if (days == 1) {
                    $scope.dayActive = true;
                    $scope.weekActive = false;
                    $scope.monthActive = false;
                    $scope.yearActive = false;
                    $scope.customActive = false;
                    $scope.showDatePickers = false;
                }
                else if (days == 7) {
                    display7thButton();
                }
                else if (days == 30) {

                    $scope.dayActive = false;
                    $scope.weekActive = false;
                    $scope.monthActive = true;
                    $scope.yearActive = false;
                    $scope.customActive = false;
                    $scope.showDatePickers = false;
                }
                else if (days == 365) {
                    $scope.dayActive = false;
                    $scope.weekActive = false;
                    $scope.monthActive = false;
                    $scope.yearActive = true;
                    $scope.customActive = false;
                    $scope.showDatePickers = false;
                }
                else if (days == 'custom') {
                    $scope.dayActive = false;
                    $scope.weekActive = false;
                    $scope.monthActive = false;
                    $scope.yearActive = false;
                    $scope.customActive = true;
                    $scope.showDatePickers = true;
                }

                $scope.format = 'dd-MMMM-yyyy';
                $scope.maxDate = new Date();
                $scope.openCalender1 = function ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.open.opened1 = true;
                }

                $scope.openCalender2 = function ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.open.opened2 = true;
                }

                $scope.dateOptions = {
                    formatYear: 'yy',
                    startingDay: 1
                };

                getData(days);
            }

            var dates = function(){
                //$scope.$emit('wait:start');
              $scope.minDate = new Date(moment($scope.firstDate).format('DD MMMM,YYYY'));
              if($scope.weekActive){
                getData(7);
              }
              else if($scope.firstDate && $scope.secondDate){
                getData(0, $scope.firstDate, $scope.secondDate);
              }
            };


            $scope.open = {};
            $scope.$watch('open.opened1', function (open) {
                $scope.opened1 = true;
            });

            $scope.$watch('open.opened2', function (open) {
                $scope.opened2 = true;
            });

            $scope.date = {};
            var currentDate = new Date();
            $scope.date.dt1 = currentDate
            $scope.date.dt2 = currentDate;

            $scope.$watch('date.dt1', function(firstDate){
              $scope.firstDate = moment(new Date(firstDate)).format('YYYY-MM-DD');
              dates();
            });

            $scope.$watch('date.dt2', function(secondDate){
              $scope.secondDate = moment(new Date(secondDate)).format('YYYY-MM-DD');
              dates();
            });

            $scope.displaySummary = function (monitor) {
                var summaryInstance = $modal.open({
                    templateUrl: 'javascripts/app/features/provider/monitor/patientSummary.html',
                    controller: 'PatientSummaryControllerModal',
                    resolve: {
                        monitor: function () {
                            return monitor;
                        },
                    }
                });
            };


            $scope.printChart = function () {
                var that = this;
                setTitleText($scope.selectedDays);
                //if($scope.selectedDays)
                //    setTimeText($scope.selectedDays);

                $timeout(function () {
                    var chart = that.chartConfig.getHighcharts();
                    chart.exportChart({
                        type: 'application/pdf',
                        filename: getFileName()
                    });
                    setChartTitle();
                    //$scope.selectedDays=null;
                }, 10);
            };

            $scope.chartConfig = {
                options: {
                    navigation: {
                        buttonOptions: {
                            enabled: false
                        }
                    },
                    chart: {
                        type: 'line',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    plotOptions: {
                        column: {
                            stacking: 'normal',
                            states: {
                                hover:
                                    {
                                        color: {
                                            linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
                                            stops: [
                                                [0, '#F05F3A'],
                                                [1, '#EF3809']
                                            ]
                                        }
                                    }
                            },
                            color: {
                                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                                stops: [
                                    [0, '#00918a'],
                                    [1, '#00ABA2']
                                ]
                            }
                        },
                        series: {
                            point: {
                                events: {
                                    click: function (e) {
                                        var indexIndex = this.index;
                                        if (e && e.point.extra.clickable) {
                                            $modal.open({
                                                templateUrl: 'javascripts/app/features/provider/monitor/details/details.html',
                                                controller: 'details',
                                                resolve: {
                                                    series: function () {
                                                        return $scope.series;
                                                    },
                                                    id: function () {
                                                        return indexIndex;
                                                    },
                                                    date: function () {
                                                        var qCount = $scope.series.length / _.get($scope.questionCategories, e.point.index + '.data.length');
                                                        if (isNaN(qCount) || qCount !== Math.round(qCount)) {
                                                            qCount = 5;
                                                        }
                                                        return $scope.series[(e.point.index ? (e.point.index + 1) : 1) * qCount - 1].extra.date;
                                                    },
                                                }
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    },
                    tooltip: {
                        borderWidth: 0,
                        useHTML: true,
                        backgroundColor: '#FFFFFF',
                        formatter: function () {
                            var indicator = '<tr><td><b>Indicator</b></td><td>' + _.capitalize(this.point.extra.name) + '</td></tr>';
                            var unit = this.point.extra.unit != null ?
                                "<tr><td><b>Unit</b></td><td>" + this.point.extra.unit + "</td></tr>" : "";
                            var readingValue = this.point.extra.reading ? this.point.extra.reading : this.point.extra.answer ? this.point.extra.answer : 0
                            var reading = '<tr><td><b>Reading</b></td><td>' + readingValue + '</td></tr>';

                            var dayOnlyformat = this.point.extra.dayOnly ? 'D MMM YYYY' : 'D MMM YYYY h:mm A';
                            var format = this.point.extra.name.toLowerCase() == 'hour' ? 'MM/DD/YYYY' : dayOnlyformat;
                            var date = this.point.extra.date ?
                                "<tr><td><b>Date</b></td><td>" +
                                moment(this.point.extra.date).format(format) +
                                "</td></tr>" : "";

                            if (this.point.extra.month) {
                                date = "<tr><td><b>Month</b></td><td>" + this.point.extra.month + "</td></tr>";
                                reading = "<tr><td><b>Avg Reading</b></td><td>" + this.y + "</td></tr>";
                            }

                            var serialNumber = this.point.extra.serialNumber ?
                                "<tr><td><b>Serial Number</b></td><td>" + this.point.extra.serialNumber + "</td></tr>" : "";

                            return '<table class="text-left table-condensed">' + indicator + unit + reading + date + serialNumber + '</table>';
                        }
                    },
                    yAxis: $scope.yAxis,
                    xAxis: $scope.xAxis,
                    series: $scope.chartSeries,
                    //legend: {enabled: false}
                },
                series: $scope.chartSeries,
                title: { text: null },
                subtitle: { text: null },
                credits: { enabled: false },
                loading: false,
                xAxis: $scope.xAxis,
                yAxis: $scope.yAxis,
                //legend: {enabled: false}
            };
        }
    ]);
