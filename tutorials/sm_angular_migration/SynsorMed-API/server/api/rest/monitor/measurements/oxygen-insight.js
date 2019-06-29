'use strict';

var _ = require('lodash');
var reader = require('./reader');
var units = require('../../../service/drivers/base/units');
var moment = require('moment');

var series = [
    {
        data: [],
        config: {}
    },
    {
        data: [],
        config: {}
    }
];

var getUsageHours = function(dayData){
    var sortedDayData = dayData.sort(function(a, b){
       return new Date(Object.keys(b)[0] ) - new Date( Object.keys(a)[0] );
    });

    if(sortedDayData.length <= 1) return  0;

    if(sortedDayData.length > 1 && sortedDayData[0][Object.keys(sortedDayData[0])[0]] == 0){
      sortedDayData = sortedDayData.splice(1,sortedDayData.length-1);
    }

    if(sortedDayData[0][Object.keys(sortedDayData[0])[0]] == 0 || sortedDayData[sortedDayData.length - 1][Object.keys(sortedDayData[sortedDayData.length - 1])] == 0) return 0;

    var usageTime = Math.abs( sortedDayData[0][Object.keys(sortedDayData[0])[0]] - (sortedDayData[sortedDayData.length - 1][Object.keys(sortedDayData[sortedDayData.length - 1])]));

    return parseFloat(usageTime.toFixed(2));
}

var getMachineHours = function(dayData){
    var sortedDayData = dayData.sort(function(a, b){
       return new Date(Object.keys(b)[0] ) - new Date( Object.keys(a)[0] );
    });

    var maxHour = [];

    _.forEach(sortedDayData, function(hour, date){
      for(var key in hour){
        maxHour.push(hour[key]);
      }
    });

    return  Math.max.apply(null, maxHour);
}


var parseAlertData = function(alerts, serialNumbers, latestSN, serviceName){
    var currentDataKeys = [];

    var response = {
        alerts: [],
        categories: []
    };

    var alertsColor = {
        'EEPROM': '#7eb5eb', 'Lost Power': '#3d4547',
        'Under 70': '#93ec7e', 'Under 85': '#eea055',
        'Low Flow Rate': '#8388c0', 'High Flow Rate': '#f25d7d',
        'Ambient Pressure': '#e9d757', 'Non Use 3 Days': '#289093', 'Cleared': '#83BCC0'
    };

    var latestDates = {
        'EEPROM': null, 'Lost Power': null,
        'Under 70': null, 'Under 85': null,
        'Low Flow Rate': null, 'High Flow Rate': null,
        'Ambient Pressure': null, 'Non Use 3 Days': null, 'Cleared': null
    };

    if(serviceName == 'eclipse'){
      alertsColor = {
          'Warning': '#7eb5eb', 'Low Oxygen Levels': '#f25d7d', 'Flow Out of Range': '#93ec7e', 'Fail Circuit Board': '#8388c0', 'Malfunction': '#eea055', 'Non Use 3 Days': '#289093', 'Cleared': '#83BCC0'
      };
      latestDates = {
          'Warning': null, 'Low Oxygen Levels': null, 'Flow Out of Range': null, 'Fail Circuit Board': null, 'Malfunction': null,'Non Use 3 Days': null, 'Cleared': null
      };
    }

    var allErrors = Object.keys(alertsColor);

    _.forEach(alerts, function(alert){
         currentDataKeys = _.union(currentDataKeys, Object.keys(alert)); // find all data keys
    });

    var temp ={};

    _.forEach(alerts, function(errors, date){
        response.categories.push(units.getDateFromString(date)); // push categories for alerts
        _.forEach(errors, function(value, name){
          var alertName = name;
            if(name == "Under 85") alertName = 'Low Oxygen Levels';
            if(name == 'Low Flow Rate') alertName = 'Low Flowrate (below 1/4 LPM)';
            if(name == "Ambient Pressure") alertName = 'Ambient Pressure Sensor Failure';
            if(name == "EEPROM") alertName = 'Fail Circuit Board';
            if(name == "High Flow Rate") alertName = 'High Flowrate (over 6 LPM)';
            if(name == "Under 70") alertName = 'Low Oxygen';
            //_.forEach(allErrors, function(alert){
                //if(name == alert){
                    temp[name] = temp[name] || [];
                    temp[name].push({
                        y: parseInt(value),
                        color: alertsColor[name],
                        name: alertName,
                        extra: {
                            reading: parseInt(value),
                            name: alertName,
                            unit: 'unit',
                            date:date,
                            serialNumber: serialNumbers[date] ? serialNumbers[date] : (latestSN ? latestSN : false)
                        }
                    });

                    if(name && date){
                        if(latestDates[name]){
                            if(new Date(latestDates[name]) < new Date(date) ){
                               latestDates[name] = date;
                            }
                        }
                        else{
                           //latestDates[name] = units.getFormattedDateTime(date);
                           latestDates[name] = date;
                        }
                    }
                //}
                // else{
                //     temp[alert] = temp[alert] || [];
                //     temp[alert].push({
                //         name: alert,
                //         extra: {
                //             name: alert
                //         }
                //     });
                // }
            //});
        });
    });
    var tempLength = Object.keys(temp).length;

    var keys = Object.keys(temp);

    _.forEach(temp, function(data){
        for(var i=0; i<tempLength;i++){
            if(data[i]){
                response.alerts[i] = response.alerts[i] || {name: keys[i], color: alertsColor[ keys[i]], data: []};
                response.alerts[i].data.push(data[i]);
            }
            else{
                response.alerts[i] = response.alerts[i] || {name: keys[i], color: alertsColor[ keys[i]], data: []};
                response.alerts[i].data.push(null);
            }
        }
    });

   response.latestDates = latestDates;
   return response;
};

var getLatestSerialNumber = function(serialNumbers){
    var response = {};
    _.forEach(serialNumbers, function(serialNumber, key){
        var tempResp = {};
        if(_.isEmpty(response)){
            tempResp[key] = serialNumber;
        }
        else{
             var currDate = units.getUnixFromFormattedDateTime(key);
             var lastDate = units.getUnixFromFormattedDateTime(Object.keys(response)[0]);
             if(currDate >= lastDate) tempResp[key] = serialNumber;
        }
        response = tempResp;
   });
   return response;
};

var getSerialNumbers = function(results){
    var serialNumbers = reader({name: 'serial number'}, 'c5', results, true);
    return {data: serialNumbers, latest: getLatestSerialNumber(serialNumbers)};
};

module.exports = function (data, dates, results, measurementUnits, measurementUnits2, newDates, serviceName) {

    var seriesData = [];
    var purityData = [];
    var extraCategories = {};

    var serialNumbersData= getSerialNumbers(results);
    var serialNumbers = serialNumbersData.data;
    var latestSN = _.isEmpty(serialNumbersData.latest) ? false : serialNumbersData.latest[Object.keys(serialNumbersData.latest)[0]];

    var roundValue = function(value){
      if(value == 0) return 0;
      return (Math.round(value * 2) / 2).toFixed(1);
    }

    dates.forEach(function(entry){
        //var snKey = units.getDateFromString(entry);
        var object = data[entry];
        if(_.isObject(object)){
            seriesData.push({
                y: parseFloat(roundValue(object[measurementUnits.name.toLowerCase()], 0.5)),
                extra: {
                    reading: roundValue(object[measurementUnits.name.toLowerCase()], 0.5),
                    name: measurementUnits.name,
                    unit: measurementUnits.unit,
                    date: units.getDateInZuluFormat(entry)
                    //serialNumber: serialNumbers[snKey] ? serialNumbers[snKey] : (latestSN ? latestSN : false)
                }
            });
            purityData.push({
                y: parseFloat(measurementUnits.upperbound),
                extra: {
                    reading: measurementUnits.upperbound,
                    name: 'Target Flow',
                    unit: measurementUnits2.unit,
                    date: units.getDateInZuluFormat(entry)
                }
            });
        }
        else{
            seriesData.push({
                y: parseInt(data[entry]),
                extra: {
                    reading: data[entry],
                    name: measurementUnits.name,
                    unit: measurementUnits.unit,
                    date: units.getDateInZuluFormat(entry)
                }
            });
        }
    });

    var hours = reader({name: 'hours'}, 'c5', results, true);
    var hoursObj = {};
    var hoursTotalData = [];
    var machineData = [];
    var hoursCat;
    var extraSeries = {
        hours: [
          {
            data: [],
            config: {}
          },
          {
            data: [],
            config: {}
          }
        ]
    };

    if(hours){

      _.forEach(hours, function(reading, date){
          var tempDate = moment(date).format('YYYY-MM-DD');
          hoursObj[tempDate] = hoursObj[tempDate] || [];
          hoursObj[tempDate].push({
              [date]: reading
          });
      });

      var prevVal = null;

      var hoursKeys = Object.keys(hoursObj).sort();
      var hoursTempObj = hoursObj;
      var hoursObj = {};

      _.forEach(hoursKeys, function(date){
        _.forEach(hoursTempObj, function(reading, tempDate){
          if(date == tempDate){
            hoursObj[tempDate] = reading;
          }
        });
      });

      _.forEach(hoursObj, function(value, key){
        if(prevVal){
          var prevDate = moment(prevVal, 'YYYY-MM-DD');
          var currentDate = moment(key, 'YYYY-MM-DD');
          while(currentDate.diff(prevDate, 'days') > 1){
            prevDate = prevDate.add(1, 'days');
            var formattedPrevdate = prevDate.format('YYYY-MM-DD');
            hoursObj[formattedPrevdate] = hoursObj[formattedPrevdate] || [];
            hoursObj[formattedPrevdate].push({
              [formattedPrevdate]: 0
            });
          }
        }
        prevVal = key;
      });

      var hoursObjKeys = Object.keys(hoursObj).sort();
      var tempObj = hoursObj;
      var hoursObj = {};

      hoursCat = hoursObjKeys;

      _.forEach(hoursObjKeys, function(date){
        var utcDate = new Date(date);
        //hoursCat.push(units.getDateInZuluFormat(date));
        _.forEach(tempObj, function(reading, tempDate){
          if(date == tempDate){
            ///var formattedDate = moment(new Date(tempDate)).format('D MMM YYYY HH:mm:ss');
            hoursObj[tempDate] = reading;
          }
        });
      });

      _.forEach(hoursObj, function(value, key){
        var reading = getMachineHours(value);
        machineData.push({
          y: reading,
          extra: {
            reading: reading.toFixed(1),
            name: 'hour',
            unit: 'hour',
            date: key
          },
          name: 'Machine Time'
        });
      });

      _.forEach(hoursObj, function(value, key){
        var reading = getUsageHours(value);
        hoursTotalData.push({
          y: reading,
          extra: {
            reading: reading.toFixed(1),
            name: 'hour',
            unit: 'hour',
            date: key
          },
          name: 'Usage Time'
        });
      });

      extraSeries.hours[1].data = machineData;
      extraSeries.hours[1].yAxis = 1;

      extraSeries.hours[0].data = hoursTotalData;
      extraCategories.hours = hoursCat;
    }

    var alerts = reader({name: 'alerts'}, 'c5', results, true);
    if(alerts){
        if(extraSeries) extraSeries.alarms = [];
        else  extraSeries = { alarms: [] };

        var alertData = parseAlertData(alerts, serialNumbers, latestSN, serviceName);
        extraCategories.alarms = alertData.categories;
        extraSeries.alarms = alertData.alerts;
        extraSeries.latestDates = alertData.latestDates;
    }

    series[0].data = seriesData;
    series[0].units = measurementUnits;

    if(purityData.length){
        series[1].data = purityData;
        //series[1].yAxis = 1;
        series[1].units = measurementUnits2;
        series[0].type = 'column';
    }

    return {
        categories: newDates,
        series: series,
        extraSeries: extraSeries ? extraSeries : null,
        extraCategories: extraCategories
    };
};
