'use strict';

var Q = require('q');
var messageList = require('./messageList');

module.exports = function(decision, measurmentName, upperbound, lowerbound, patientName){
    var defer = Q.defer();
    var data = {
        name : patientName,
        average: decision.average,
        lowerbound: lowerbound,
        upperbound: upperbound
    };
    if(decision.reason.isMissed){
        data.isMissed = true;
        data.readings = decision.latestMissed;
    }
    else if(decision.reason.isOutOfBound){
        data.isOutOfBound = true;
        data.readings = decision.latestMissed;
    }
    else{
        data.messageOk = true;
        data.readings = decision.latestMissed;
    }
    messageList(data, measurmentName)
    .then(function(message){
        defer.resolve(message);
    })
    .catch(defer.reject);
    return defer.promise;
};
