'use strict';

var pluralize = require('pluralize');
var moment = require('moment');
var _ = require('lodash');

/** A small library for fetching the Units for each system **/

/** United States of America Based standards **/
var US = {
  duration        : 'milliseconds',
  distance        : 'miles',
  elevation       : 'feet',
  height          : 'inches',
  weight          : 'lbs',
  measurements    : 'inches',
  liquids         : 'fl oz',
  'blood glucose' : 'mg/dL',
  sleep           : 'hours',
  temperature     : 'fahrenheit',
  breath          : 'bpm',
  'oxygen flow'   : 'lpm',
  'oxygen purity' : '%',
  'caloric intake' : 'cal',
  'oxygen saturation' : '%',
  'peak flow rate' : 'L/min'
};

/** European Standards **/
var UK = {
  duration        : 'milliseconds',
  distance        : 'kilometers',
  elevation       : 'meters',
  height          : 'centimeters',
  weight          : 'stone',
  measurements    : 'centimeters',
  liquids         : 'milliliters',
  'blood glucose' : 'mmol/l',
  sleep           : 'hours',
  temperature     : 'celsius',
  breath          : 'bpm',
  'oxygen flow'   : 'lpm',
  'oxygen purity' : '%',
  'caloric intake' : 'cal',
  'oxygen saturation' : '%',
  'peak flow rate' : 'L/min'
};

/** Indian and other SI Based systems  **/
var Metric = {
  duration        : 'milliseconds',
  distance        : 'kilometers',
  elevation       : 'meters',
  height          : 'centimeters',
  weight          : 'kilograms',
  measurements    : 'centimeters',
  liquids         : 'milliliters',
  'blood glucose' : 'mmol/l',
  sleep           : 'hours',
  temperature     : 'fahrenheit',
  breath          : 'bpm',
  'oxygen flow'   : 'lpm',
  'oxygen purity' : '%',
  'caloric intake' : 'cal',
  'oxygen saturation' : '%',
  'peak flow rate' : 'L/min'
};


exports.getDateInZuluFormat = function(date){
      return moment(date, 'DD MMM YYYY HH:mm:ss.SSSZ').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
};

/* get difference between two dates in days*/
exports.getDateDifferenceInDays = function(dateOne, dateTwo){
    dateOne = moment(new Date(dateOne));
    dateTwo = moment(new Date(dateTwo));
    return Math.abs(dateOne.diff(dateTwo, 'days'));
};

/*get formated date from date string*/
exports.getDateFromString = function(date){
    if(!date) return moment().format('D MMM YYYY').toString();
    return moment(date, 'D MMM YYYY HH:mm:ss').format('D MMM YYYY').toString();
};

/** generate a formated date for display in api response **/
exports.getFormattedDate = function(dateTime){
  return moment(dateTime).format('D MMM YYYY').toString();
};
exports.getISOFormattedDate = function(dateTime){
  return moment(dateTime).format('YYYY-MM-DD').toString();
}
exports.getFormattedDateTime = function(dateTime){
  return moment(dateTime).format('D MMM YYYY HH:mm:ss').toString();
};
exports.getFormattedDateTimeMilli = function (dateTime) {
  return moment(dateTime).format('D MMM YYYY HH:mm:ss.SSSZ').toString();
};
exports.getFormattedDateTimeUnix = function(dateTime){
  return moment.unix(dateTime).format('D MMM YYYY HH:mm:ss').toString();
};

exports.getUnixFromFormattedDateTime = function(dateTime){
  return moment(dateTime, 'D MMM YYYY HH:mm:ss').unix();
};

/** generate a formated date for display in api response **/
exports.getFormattedDateFromUnix = function(unix){
  return moment.unix(unix).format('D MMM YYYY').toString();
};

/** generate a unix timestamp form date **/
exports.getUnix = function(dateTime){
  return moment(dateTime).unix();
};

/**
  Accept any data and return a unit suffixed string

  @param data Int ,
  @parma type String , The type which you want to access 'height , weight'
  @param system String , en_US / en_GB / METRIC or (null == METRIC)
*/
exports.getUnitConverted = function(data, type, system){
    var unit = this.getUnit(type, system);
    if(!unit){ //selected type not found
      return data;
    }
    return (data + ' ' + pluralize(unit, data));
};

/** returns the unit for a system **/
exports.getUnit = function(type, system){
    switch(system){
      case 'en_US' :
        system = US;
      break;

      case 'en_GB' :
        system = UK;
      break;

      case 'METRIC' :
      default :
      system = Metric;
    }

    return (system[type] === undefined) ? false : system[type];
};

/** suffix (<unit>) with a string **/
exports.embedUnit = function(string, type, system){
    var unit = this.getUnit(type, system);
    return (unit === false) ? string : string + ' (' + unit + ')';
};

/**
*
* Rounding off function for decimal value
* @param val, Integer , measurement reading of weight
*
**/
exports.getRoundOff = function(val){

    var result = (Math.round(val * 2) / 2).toFixed(1);

    return isNaN(result) ? null : result.replace(/\.0+$/, '');

};

/**
*Filter data according to time
* @param data     , Collection  , data to attach after filtering
* @param key      , String      , Key name under which the data will be added
* @param time     , Integer     , time in minutes
*/

exports.combineDataAccordingToTime = function(data, minutes){
    var heartBeatData = {};
    var dateFormat = 'D MMM YYYY HH:mm:ss';

    var arrangeDataAccordingToDate = function(dataAtDate){
        var temp = {};
        for(var date in dataAtDate){
            var dateObj = moment(date, dateFormat);
            var key = dateObj.format('D') + '-' + dateObj.format('M') + '-' + dateObj.format('YYYY');
            temp[key] = temp[key] || [];
            var tempObj = {};
            tempObj[date] = dataAtDate[date];
            temp[key].push(tempObj);
        }
        return temp;
    };

    var findGreatestReading = function(TimeRecords){
        var gretestReading = 0;
        var grestestObject = false;
        TimeRecords.forEach(function(recordObj){
             if(recordObj[Object.keys(recordObj)[0]] >= gretestReading){
                 grestestObject = recordObj;
                 gretestReading =  recordObj[Object.keys(recordObj)[0]];
             }
        });
        return grestestObject;
    };

    var getHeartBeatData = function(timeCatArray){
        for (var record in timeCatArray){
          var temp = findGreatestReading(timeCatArray[record]);
          heartBeatData[Object.keys(temp)[0]] = temp[Object.keys(temp)[0]];
        }
        return heartBeatData;
    };

    var filterDates = function(arrangedDates, minutes){
        minutes = minutes ? (minutes+2) : 17;
        var timeCatArray = {};


        _.forEach(arrangedDates, function(dayDate, day){
             var upperDateLimit =  moment(Object.keys(dayDate[0])[0], dateFormat).add(1, 'minutes');
             var lowerDateLimit =  moment(upperDateLimit, dateFormat).subtract(minutes, 'minutes');

             dayDate.forEach(function(record){
                 var currentDate = moment(Object.keys(record)[0], dateFormat);
                 if(currentDate.isBetween(lowerDateLimit, upperDateLimit, 'minutes')){
                     if(!timeCatArray[lowerDateLimit]){
                         timeCatArray[lowerDateLimit]=[];
                     }
                     timeCatArray[lowerDateLimit].push(record);
                 }
                 else{
                     upperDateLimit = moment(Object.keys(record)[0], dateFormat).add(1, 'minutes');
                     lowerDateLimit = moment(upperDateLimit, dateFormat).subtract(minutes, 'minutes');
                     if(!timeCatArray[lowerDateLimit]){
                         timeCatArray[lowerDateLimit]=[];
                     }
                     timeCatArray[lowerDateLimit].push(record);
                 }
             });

        });
        return getHeartBeatData(timeCatArray);
    };

  return (typeof data == 'object' ? filterDates (arrangeDataAccordingToDate(data)) : data );
};

/**
 * Get latest record date from data
 * @param data, Array, contains data
 * @param dateKeyInData, String, name of date key in data
 * @param valueKey, String, name of data value key in data at particular date
 * @return Date, latest record date
 */
exports.getGreatestDate = function(data, dateKeyInData, valueKey){
    if(!data || !data.length || !dateKeyInData) return false;
    var gretestSynDate = 0;
    _.forEach(data, function(record){
        if(valueKey && !parseInt(record[valueKey])) return;
        var tempDate= moment(record[dateKeyInData]);
        gretestSynDate = ( (tempDate > gretestSynDate) ? tempDate : gretestSynDate);
    });
    return gretestSynDate;
};

exports.getLastThirtyDayData = function(data, dateKeyInData){
    var today = moment();
    var ago31Day = moment().subtract(31, 'days').startOf('day');
    var response = [];
    _.forEach(data, function(record){
        var tempDate= moment(record[dateKeyInData]);
        if(tempDate.isBetween(ago31Day, today)) response.push(record);
    });
    return response;
};
