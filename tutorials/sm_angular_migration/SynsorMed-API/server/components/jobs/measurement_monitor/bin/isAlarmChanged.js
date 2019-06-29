'use strict';

var Q = require('q');
var isAlarMed = require('../../../../rules/monitor').isAlarMed;

module.exports = function(latestAlarms, lastAlarms){
    var defer = Q.defer();
    var newAlarms = isAlarMed(latestAlarms, lastAlarms);
    defer.resolve(newAlarms);
    return defer.promise;
};
