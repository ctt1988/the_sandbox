'use strict';

var Q = require('q');
var _ = require('lodash');
var alarm = require('./alarm');
var units = require('../base/units');
var masterAdapter = require('../base/master-adapter');
var moment = require('moment');

var getWeek = moment().subtract(7, 'd').format('YYYY-MM-DD');
var currentDate = moment().format('YYYY-MM-DD');
var getMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD');
var getThreeMonths = moment(currentDate).subtract(2, 'months').startOf('month').format('YYYY-MM-DD');
var getSixMonths = moment(currentDate).subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
var getYear = moment(currentDate).startOf('year').format('YYYY-MM-DD');

var getLastSyncDate = function(oauthData){
     if(!oauthData) return false;
     if(oauthData.oauthModelInstance && oauthData.oauthModelInstance.last_sync){
         return oauthData.oauthModelInstance.last_sync;
     }
     else{
         var greatestSyncDate = 0;
         _.forEach(oauthData, function(result, key){
             if(key == 'oxy_flow'){
                 var gretestInRecord = units.getGreatestDate(result, 'endDate', 'quantity');
                     greatestSyncDate = (gretestInRecord > greatestSyncDate) ? gretestInRecord : greatestSyncDate;
             }
         });
         return greatestSyncDate ? greatestSyncDate.format() : false;
     }
};


//function to format data before uplaod
exports.formatData = function(data, oldData){
    var deferred = Q.defer();
    var newData = oldData ? (typeof oldData == 'string' ? JSON.parse(oldData) : oldData) : {};
    if(!data && !data.length) deferred.resolve(oldData);

    _.forEach(data, function(chunk){
        newData.serial_number = newData.serial_number ? newData.serial_number : [];
        if(!chunk || !chunk.timestamp) return;
        if(!chunk.serialNumber){ //if no serialNumber means eclipse device is lost
            chunk.serialNumber = newData.serial_number && newData.serial_number.length
                                 ? newData.serial_number[0].quantity : 'N/A';
            chunk.hours = '0';

            if(newData.alerts && newData.alerts.length){
                newData.alerts.push({
                    quantity: newData.alerts[0].quantity,
                    endDate: chunk.timestamp
                });
            }
            else{
              chunk.alarm = '000000';
            }

        }

        if(chunk.serialNumber)
        newData.serial_number.push({quantity: chunk.serialNumber, endDate: chunk.timestamp }); //serialNumber

        if(chunk.flow)
        newData.oxy_flow = newData.oxy_flow ? newData.oxy_flow : [];
        newData.oxy_flow.push({quantity: chunk.flow, endDate: chunk.timestamp });// flow rate

        if(chunk.purity)
        newData.oxy_purity = newData.oxy_purity ? newData.oxy_purity : [];
        newData.oxy_purity.push({quantity: chunk.purity, endDate: chunk.timestamp }); // oxygen purity

        if(chunk.respiratoryRate)
        newData.resp_rate = newData.resp_rate ? newData.resp_rate : [];
        newData.resp_rate.push({quantity: chunk.respiratoryRate, endDate: chunk.timestamp }); // respiratory rate

        if(chunk.hours)
        newData.hours = newData.hours ? newData.hours : [];
        newData.hours.push({quantity: chunk.hours, endDate: chunk.timestamp }); // hours
        var alertQuantity = alarm.getFromCode(chunk.alarm);
        newData.alerts = newData.alerts ? newData.alerts : [];
        if(!_.isEmpty(alertQuantity))
        newData.alerts.push({ quantity: alertQuantity, endDate: chunk.timestamp }); // alarm
    });

    deferred.resolve(newData);
    return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData){
    var deferred = Q.defer();
    var fetchDays = oauthData.days ? oauthData.days : 30;
    var entries = oauthData.entries ? oauthData.entries : false;
    var lastSyncTime = getLastSyncDate(oauthData);
    var response = {};

    if(!_.isEmpty(oauthData.serial_number)){
      response['serial number'] = filterSerialNumber(oauthData.serial_number, fetchDays, entries);
    }

    if(!_.isEmpty(oauthData.oxy_flow)){
      response['Oxygen Flow Rate (lpm)'] = filterOxygenFlowRate(oauthData.oxy_flow, fetchDays, entries);
    }

    if(!_.isEmpty(oauthData.resp_rate)){
      response['breath (bpm)'] = filterRespiratoryRate(oauthData.resp_rate, fetchDays, entries);
    }

    if(!_.isEmpty(oauthData.oxy_purity)){
      response['Oxygen Purity (%)'] = filterOxygenPurity(oauthData.oxy_purity, fetchDays, entries);
    }

    if(!_.isEmpty(oauthData.hours)){
      response['hours'] = filterHours(oauthData.hours, fetchDays, entries);
    }

    if(!_.isEmpty(oauthData.alerts)){
        var alerts = filterAlerts(oauthData.alerts, fetchDays, entries);
      response['alerts'] = alerts.response;
      response['alarms'] = alerts.raw;
    }

    var results = masterAdapter.buildAdapter(response, 'Oxygen', 'Oxygen data for last 30 days.', lastSyncTime);
    deferred.resolve(results);
    return deferred.promise;
};

// Common filter method for Oxygen flow and purity
var filterData = function(data, fetchDays, allowPrecisionValue, entries){
    if(data === undefined) return false;
    var returns = {};
    var days = [];

    //if(entries && data && data.length > entries) data.splice(0, (data.length - entries));
    data.forEach(function(val){
        // if(days.length >= fetchDays){
        //     return;
        // }

        val['quantity'] = isNaN(val['quantity']) ? val['quantity'] : (val['quantity']);
        val['quantity'] = allowPrecisionValue ? parseFloat(parseFloat(val['quantity']).toFixed(2)) : parseInt(val['quantity']);

        var tmpKey = units.getISOFormattedDate(val['endDate']);
        var newTmpKey = moment(tmpKey).format('YYYY-MM-DD');

        if(newTmpKey <= moment().format('YYYY-MM-DD') && newTmpKey >= moment().subtract(fetchDays,'days').format('YYYY-MM-DD')){

            //If endDate is within the correct range, add the quantity to the array
            returns[units.getFormattedDateTime(val['endDate'])]= val['quantity'];

        };

        // if(fetchDays == 1){
        //     if(newTmpKey == currentDate){
        //         returns[units.getFormattedDateTime(val['endDate'])]= val['quantity'];
        //     }
        // }else if(fetchDays == 7){
        //     if(newTmpKey >= getWeek){
        //         returns[units.getFormattedDateTime(val['endDate'])]= val['quantity'];
        //     }
        // }else if(fetchDays == 30){
        //     if(newTmpKey >= getMonth){
        //         returns[units.getFormattedDateTime(val['endDate'])]= val['quantity'];
        //     }
        // }else if(fetchDays == 90){
        //     if(newTmpKey >= getThreeMonths){
        //         returns[units.getFormattedDateTime(val['endDate'])]= val['quantity'];
        //     }
        // }else if(fetchDays == 180){
        //     if(newTmpKey >= getSixMonths){
        //         returns[units.getFormattedDateTime(val['endDate'])]= val['quantity'];
        //     }
        // }else if(fetchDays == 365){
        //     if(newTmpKey >= getYear){
        //         returns[units.getFormattedDateTime(val['endDate'])]= val['quantity'];
        //     }
        // }


        //console.log(tmpKey, val['quantity']);
        if(days.indexOf(tmpKey)==-1) days.push(tmpKey);

    });
    return returns;
};

var filterAlertsData = function(data, fetchDays, entries){
    if(data === undefined) return false;
    var returns = {};
    var days = [];
    var response = {};
    var prevEntry = {};
    // if(entries && data && data.length > entries){
    //     data.splice(0, (data.length - entries));
    // }
    data.forEach(function(val){
        var tmpKey = units.getISOFormattedDate(val['endDate']);
        var newTmpKey = moment(tmpKey).format('YYYY-MM-DD');

        if(days.indexOf(tmpKey)==-1) days.push(tmpKey);
        //if(days.length > fetchDays) return;
        val['quantity'] = isNaN(val['quantity']) ? val['quantity'] : (val['quantity']);

        //if(val['quantity'] && val['quantity'].Cleared) return;

        //returns[units.getFormattedDateTime(val['endDate'])]= _.clone(val['quantity']);

        if(newTmpKey <= moment().format('YYYY-MM-DD') && newTmpKey >= moment().subtract(fetchDays,'days').format('YYYY-MM-DD')){

            //If endDate is within the correct range, add the quantity to the array
            returns[val['endDate']] = _.clone(val['quantity']);

        };

        // if(fetchDays == 1){
        //     if(newTmpKey == currentDate){
        //         returns[val['endDate']] = _.clone(val['quantity']);
        //     }
        // }else if(fetchDays == 7){
        //     if(newTmpKey >= getWeek){
        //         returns[val['endDate']] = _.clone(val['quantity']);
        //     }
        // }else if(fetchDays == 30){
        //     if(newTmpKey >= getMonth){
        //         returns[val['endDate']] = _.clone(val['quantity']);
        //     }
        // }else if(fetchDays == 90){
        //     if(newTmpKey >= getThreeMonths){
        //         returns[val['endDate']] = _.clone(val['quantity']);
        //     }
        // }else if(fetchDays == 180){
        //     if(newTmpKey >= getSixMonths){
        //         returns[val['endDate']] = _.clone(val['quantity']);
        //     }
        // }else if(fetchDays == 365){
        //     if(newTmpKey >= getYear){
        //         returns[val['endDate']] = _.clone(val['quantity']);
        //     }
        // }

        if(!response[tmpKey]){
            response[tmpKey] = val['quantity'];
        }
        else{
            var prevData = response[tmpKey];
            var currentData = val['quantity'];
            var keysOne = Object.keys(prevData);
            var keysTwo = Object.keys(currentData);
            var keys = _.uniq(_.concat(keysOne, keysTwo));

            _.forEach(keys, function(key){
                if( (Object.keys(prevEntry)[0]==tmpKey) && (prevEntry[Object.keys(prevEntry)[0]][key] && currentData[key]) ) return;
                var prevVal = prevData[key] || 0;
                var currVal = currentData[key] || 0;
                response[tmpKey][key] = prevVal + currVal;
            });

        }
        prevEntry[tmpKey] = val['quantity'];
        //console.log(tmpKey, val['quantity']);
    });
    return {response: returns, raw: response};
};

var filterSerialNumber = function(data, fetchDays, entries){
    if(data === undefined) return false;
    var returns = {};
    var days = [];
    data = _.uniqBy(data, 'endDate');
    if(entries && data && data.length > entries) data.splice(0, (data.length - entries));
    data.forEach(function(val){
        if(days.length >= fetchDays) return;

        val['quantity'] = isNaN(val['quantity']) ? val['quantity'] : (val['quantity']);

        var tmpKey = units.getFormattedDate(val['endDate']);
        //console.log(tmpKey, val['quantity']);
        if(days.indexOf(tmpKey)==-1) days.push(tmpKey);
        returns[tmpKey] = val['quantity'];
    });

    return returns;
};

//filter the Oxygen flow data from Oxygen app
var filterOxygenFlowRate = function(data, fetchDays, entries){
    data = _.uniqBy(data, 'endDate'); // remove duplicate entries
    return filterData(data, fetchDays, true, entries);
};

var filterRespiratoryRate = function(data, fetchDays, entries){
    data = _.uniqBy(data, 'endDate'); // remove duplicate entries
    return filterData(data, fetchDays, true, entries);
};

//filter Oxygen puriy data from Oxygen app
var filterOxygenPurity = function(data, fetchDays, entries){
    data = _.uniqBy(data, 'endDate'); // remove duplicate entries
    return filterData(data, fetchDays, true, entries);
};
//filter no of hours used data form Oxygen app
var filterHours = function(data, fetchDays, entries){
    data = _.uniqBy(data, 'endDate'); // remove duplicate entries
    return filterData(data, fetchDays, true, entries);
};
//filter alerts form Oxygen app
var filterAlerts = function(data, fetchDays, entries){
    data = _.uniqBy(data, 'endDate'); // remove duplicate entries
    return filterAlertsData(data, fetchDays, entries);
};


module.exports = exports;
