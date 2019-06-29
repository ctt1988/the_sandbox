'use strict';

var moment = require('moment');
var units = require('../../../service/drivers/base/units');

var getNewDates = function(measurementNameLow, dates){
    var newDates = [];
    if(measurementNameLow == 'steps' || measurementNameLow == 'sleep'){
        dates.forEach(function(date){
            newDates.push(units.getDateFromString(date));
        });
    }
    else {
        dates.forEach(function(date){
            newDates.push(units.getDateInZuluFormat(date));
        });
    }
    return newDates;
};

module.exports = function(measurementUnits, measurementUnits2, dates, data, results, serviceName){
    var lastSyncTime = results.lastSyncTime;
    var measurementName = measurementUnits.name;
    var measurementUnit = measurementUnits.unit;

    var measurementNameLow = measurementName.toLowerCase();
    var seriesData = [], stepsData = [], diastolicData = [], finalObj = {};
    var series = [{
        data: [], config: {}
    }, {
        data: [], config: {}
    }];

    var newDates = getNewDates(measurementNameLow, dates);

    switch (measurementNameLow) {
        case 'blood pressure':
            dates.forEach(function(entry){
                var arr = data[entry].split('/');
                seriesData.push({
                    y: parseInt(arr[0]),
                    extra: {
                        reading: arr[0],
                        name: measurementName + ' (SP)',
                        date: moment(entry, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                        unit: measurementUnit
                    }
                });
                diastolicData.push({
                    y: parseInt(arr[1]),
                    extra: {
                        reading: arr[1],
                        name: measurementName + ' (DP)',
                        date: moment(entry, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                        unit: measurementUnit
                    }
                });
            });
            series[0].data = seriesData;
            series[1].data = diastolicData;
            finalObj = {categories: newDates, series: series };
        break;
        case 'sleep':
            dates.forEach(function(entry){
                var tempDate = data[entry];
                var time = moment.duration(data[entry] * 3600, 'seconds');
                if(time.minutes()){
                    data[entry] = (time.minutes() < 10) ? (time.hours() + ':' + '0' +time.minutes()) : (time.hours() + ':' +time.minutes());
                }
                else {
                    data[entry] = time.hours();
                }
                seriesData.push({
                    y: parseInt(tempDate),
                    extra: {
                        reading: data[entry],
                        name: measurementName,
                        date: moment(entry, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                        unit: measurementUnit,
                        dayOnly: true
                    }
                });
            });
            series[0].data = seriesData;
            finalObj = {categories: newDates, series: series};
        break;
        case 'steps':
            var sum = 0, series2 = [];
            dates.forEach(function(entry){
                sum += parseInt(data[entry]);
                seriesData.push({
                    y: parseInt(data[entry]),
                    extra: {
                        reading: data[entry],
                        name: measurementName,
                        date: entry, //moment(entry, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                        unit: measurementUnit,
                        dayOnly: true,
                        constantDate: true
                    }
                });
                var average = seriesData.length ? parseInt(sum/seriesData.length) : 0;
                series2.push({
                    y: average,
                    extra: {
                        reading: average,
                        name: measurementName + ' (avg)',
                        date: entry, //moment(entry, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                        unit: measurementUnit,
                        dayOnly: true,
                        constantDate: true
                    }
                });
            });
            series[0].data = seriesData;
            series[1].data = series2;
            series[1].config.color = 'rgba(0, 120, 114, 0.5)';
            finalObj = {categories: newDates, series: series};
        break;
        case 'oxygen flow':
            var unit2 = {
                  name : 'oxygen purity',
                  unit : measurementUnit
             };
            finalObj = require('./oxygen-insight')(data, dates, results, measurementUnits, unit2, newDates, serviceName);
        break;
        case 'caloric intake':
            dates.forEach(function(entry){
                seriesData.push({
                    y: parseInt(data[entry]),
                    extra: {
                        reading: data[entry],
                        name: measurementName,
                        date: moment(entry, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                        unit: measurementUnit,
                        dayOnly: true
                    }
                });
            });
            series[0].data = seriesData;
            finalObj = {categories: newDates, series: series};
        break;
        case 'status':
        console.log('----------here --------------------1234')
            var extraSeries = {
                status: [
                  {
                    data: [],
                    config: {}
                  }
                ],
                steps: [
                  {
                    data: [],
                    config: {}
                  }
                ]
            };
            var stepData = results.data.steps;
            if(stepData){
              var stepDates = Object.keys(stepData);
            }
            dates.forEach(function(entry){
              console.log(data[entry]);
              var question = data[entry] ? (data[entry].question || false) : false;
              if(question){
                 seriesData.push({
                     y: isNaN(data[entry].choice) ? 100 : parseInt(data[entry].choice),
                     extra: {
                         id: data[entry].questionId,
                         question: data[entry].question,
                         answer: data[entry].choice,
                         options: data[entry].options,
                         name: measurementName,
                         date: moment(entry, 'DD MMM YYYY HH:mm:ss.SSSZ').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                         unit: measurementUnit,
                         clickable: true
                     }
                 });
             }
           });
           if(stepData){
             stepDates.forEach(function(entry){
               stepsData.push({
                 y: parseInt(stepData[entry]),
                 extra: {
                     reading: stepData[entry],
                     name: 'Step',
                     date: moment(entry, 'DD MMM YYYY HH:mm:ss.SSSZ').format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                     unit: measurementUnit,
                     dayOnly: true,
                     clickable: false
                 }
               })
             });
           }
           extraSeries.status[0].data = seriesData;
           extraSeries.steps[0].data = stepsData;
           series[0].data = seriesData;
           //series[1].data = stepsData;
           finalObj = {categories: newDates, series: series, extraSeries: extraSeries};
        break;
        case 'weight':
            dates.forEach(function(entry){
                seriesData.push({
                    y: parseFloat(data[entry]),
                    extra: {
                        reading: data[entry],
                        name: measurementName,
                        date: moment(entry, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                        unit: measurementUnit
                    }
                });
            });
            series[0].data = seriesData;
            finalObj = {categories: newDates, series: series};
        break;
        case 'oxygen saturation':
        default:
            dates.forEach(function(entry){
                seriesData.push({
                    y: parseInt(data[entry]),
                    extra: {
                        reading: data[entry],
                        name: measurementName,
                        date: moment(entry, 'D-MMM-YYYY HH:mm:ss').format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                        unit: measurementUnit
                    }
                });
            });
            series[0].data = seriesData;
            finalObj = {categories: newDates, series: series};
    }

    finalObj.lastSyncTime = lastSyncTime;
    return finalObj;
};
