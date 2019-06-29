'use strict';

var moment = require('moment');
var units = require('../../service/drivers/base/units');

var getNewDates = function(measurementNameLow, dates){
    var newDates = [];
    dates.forEach(function(date){
        newDates.push(units.getDateInZuluFormat(date));
    });
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

    if (measurementNameLow=="status") {
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
    }

    finalObj.lastSyncTime = lastSyncTime;
    return finalObj;
};
