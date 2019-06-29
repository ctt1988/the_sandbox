'use strict';

var Q = require('q');
var _ = require('lodash');
var driver = require('../../../service/driver');
var reader = require('../../monitor/measurements/reader');
var units = require('../../../service/drivers/base/units');

var getImportantData = function(measurementName, data, surveyName){
    measurementName = measurementName.toLowerCase();
    var info = {};
    var dataLength = _.size(data);
    switch (measurementName) {
        case 'oxygen flow':
           var maxFlow = 0, minFlow =0, sumFlow = 0;
           var maxPurity = 0, minPurity = 0, sumPurity = 0;
            _.forEach(data, function(chunk){
                var flowChunk = chunk['oxygen flow'];
                var purityChunk = chunk['oxygen purity'];
                if(flowChunk){
                      if(!minFlow) minFlow = flowChunk;
                      flowChunk = parseFloat(flowChunk);
                      maxFlow = maxFlow > flowChunk ? maxFlow : flowChunk;
                      minFlow = minFlow > flowChunk ? flowChunk : minFlow;
                      sumFlow = sumFlow + flowChunk;
                }
                if(purityChunk){
                    if(!minPurity) minPurity = purityChunk;
                    purityChunk = parseFloat(purityChunk);
                    maxPurity = maxPurity > purityChunk ? maxPurity : purityChunk;
                    minPurity = minPurity > purityChunk ? purityChunk : minPurity;
                    sumPurity = sumPurity + purityChunk;
                }
            });
            var flowAvg = dataLength ? (sumFlow/dataLength).toFixed(2) : 0;
            var purityAvg = dataLength ? (sumPurity/dataLength).toFixed(2) : 0;
            info.categories = [
                  'Number of submissions', 'Highest Flow',
                  'Lowest Flow', 'Average Flow', 'Highest Purity',
                  'Lowest Purity', 'Average Purity'
            ];
            info.displayData = [
                dataLength, maxFlow, minFlow, flowAvg,
                maxPurity, minPurity, purityAvg
            ];
        break;
        case 'blood pressure':
            var maxSys = 0, maxDys = 0, minSys = 0, minDys = 0;
            var sumSys = 0, sumDys = 0;
            _.forEach(data, function(chunk){
                 if(typeof chunk == 'string' && chunk.indexOf('/') != -1){
                     chunk = chunk.split('/');
                     var currentSP = parseInt(chunk[0]);
                     var currentDP = parseInt(chunk[1]);
                     if(currentSP){
                           if(!minSys) minSys = currentSP;
                           maxSys = maxSys > currentSP ? maxSys : currentSP;
                           minSys = minSys > currentSP ? currentSP : minSys;
                           sumSys = sumSys + currentSP;
                     }
                     if(currentDP){
                         if(!minDys) minDys = currentDP;
                         maxDys = maxDys > currentDP ? maxDys : currentDP;
                         minDys = minDys > currentDP ? currentDP : minDys;
                         sumDys = sumDys + currentDP;
                     }
                 }
            });
            var avgSP = dataLength ? (sumSys/dataLength).toFixed(2) : 0;
            var avgDP = dataLength ? (sumDys/dataLength).toFixed(2) : 0;

            info.categories = ['Max SP', 'Min SP', 'Avg SP', 'Max DP', 'Min DP', 'Avg DP'];
            info.displayData = [ maxSys, minSys, avgSP, maxDys, minDys, avgDP];
        break;
        case 'weight':
            var minW = 0, maxW = 0;
            _.forEach(data, function(dataChunk){
                if(!dataChunk) return;
                if(!minW) minW = dataChunk;
                dataChunk = parseFloat(dataChunk);
                maxW = maxW > dataChunk ? maxW : dataChunk;
                minW = minW > dataChunk ? dataChunk : minW;
            });
            var diff = maxW - minW;
            var change = minW ? ((diff/minW)*100).toFixed(2) : 0;
            info.categories = ['High', 'Low', 'Difference', '% Change'];
            info.displayData = [maxW, minW, diff, change];
        break;
        case 'status':
            var sub = 0;
            var currentArray = [];
            var mss = null;
            _.forEach(data, function(dataChunk, date){
                if(!currentArray.length) sub = 1;
                if(currentArray.indexOf(dataChunk.questionId) == -1) currentArray.push(dataChunk.questionId);
                else {
                    sub++;
                    mss = units.getDateInZuluFormat(date);
                    currentArray = [dataChunk.questionId];
                }
            });
            info.categories = [
                'Name of Survey',
                'Number of Submissions',
                'Date of most recent submission'
            ];
            info.displayData = [surveyName, sub, mss];
        break;
        default:
            var min = 0, max = 0, sum = 0;
            var r = ['peak flow rate', 'caloric intake', 'heartrate', 'glucose', 'temperature'];
            var readings = 0;
            _.forEach(data, function(dataChunk){
                if(!dataChunk) return;
                if(!min) min = dataChunk;
                dataChunk = parseFloat(dataChunk);
                max = max > dataChunk ? max : dataChunk;
                min = min > dataChunk ? dataChunk : min;
                sum = sum + dataChunk;
                readings++;
            });
            var average = dataLength ? (sum/dataLength).toFixed(2) : 0;
            if(r.indexOf(measurementName) != -1){
               info.categories = ['Number of readings', 'High', 'Low', 'Avg'];
               info.displayData = [readings, max, min, average];
            }
            else if(measurementName == 'oxygen saturation'){
                info.categories = ['High', 'Low', 'Avg'];
                info.displayData = [max, min, average];
            }
            else{
                info.categories = ['Total', 'High', 'Low', 'Avg'];
                info.displayData = [sum, max, min, average];
            }
    }
    return info;
};

module.exports = function(result){
    var promises = [];
    var monitor = {
        monitorId: result.id,
        code: result.patient_code,
        providerName: result.User.name,
        organizationName: result.User.Organization.name,
        notes: result.note ? JSON.parse(result.note) : null
    };
    if(result.Patient){
        monitor.patientName = result.Patient.getName();
        monitor.dob = result.Patient.dob;
        monitor.patientContact = result.Patient.mobile_number;
    }
    if(result.Measurements){
        _.forEach(result.Measurements, function(measurement){
            if(!measurement.MeasurementMonitor) return true;
            var oauthData, data;
            var promise = Q.all([
                measurement.MeasurementMonitor.getAuthData(),
                measurement.MeasurementMonitor.getStatusSurvey()
            ])
            .spread(function(measuremtnOauthData, surveyInfo){
                var surveyName = surveyInfo
                                ? (surveyInfo.display_name || surveyInfo.survey_name)
                                : null;
                if(!measuremtnOauthData){
                    return {
                        name: measurement.name,
                        results: getImportantData(measurement.name, [], surveyName)
                    };
                }
                data = measuremtnOauthData;
                oauthData = JSON.parse(data.oauth_data);
                oauthData.all = true;
                oauthData.days = 30;
                return measurement.MeasurementMonitor.getOauthMonitorToken()
                .then(function(oauthToken){
                    oauthData.oauthModelInstance = measurement.MeasurementMonitor.oauth_id ? oauthToken : measurement.MeasurementMonitor;
                    return driver.getUserDetails(data.service_name, oauthData, measurement.name);
                })
                .then(function(results){
                    var finalData = [];
                    if(results && !_.isEmpty(results)){
                        finalData = getImportantData(measurement.name, reader(measurement, data.service_name, results, true), surveyName);
                    }
                    return {
                        name: measurement.name,
                        serviceName: data.service_name,
                        results: finalData
                    };
                });
            });

            promises.push(promise);
        });
    }

    return Q.all(promises)
    .then(function(indicators){
        monitor.indicators = indicators;
        return monitor;
    });
};
