'use strict';

var Q = require('q');
var _ = require('lodash');

/**
* Check from the patient status readings if everything is ok.
*
* Resolve(true, reading) : if something went wrong
* Resolve(false, reading) : if everything is ok
* Reject(error) : Error state
*/
module.exports = function(measurement, readings, infraction){
    var deferred = Q.defer();
    var questionIds = [];
    var data = [];
    var indx = 0;
    var isAllInt = true;
    var danger = false;

    measurement.getStatusSurvey()
    .then(function(survey){
        var margin = survey ? survey.care_margin : undefined;

        _.forEach(readings, function(reading){
            if(!reading.value) return;
            _.forEach(reading.value.options, function(option){
                if(isNaN(option)) isAllInt = false;
            });
            if(!isAllInt) return;
            var questionId = reading.value.questionId;
            if(questionIds.indexOf(questionId) != -1){
                indx++;
                questionIds = [];
            }
            data[indx] = data[indx] || {};
            data[indx].value = data[indx].value ?
            data[indx].value + reading.value.choice :
            reading.value.choice;
            if(!data[indx].date) data[indx].date = reading.date;
            questionIds.push(questionId);
        });

        if(isAllInt && data.length && (data.length > 1) && (margin != undefined) ){
            for(var i = 1; i < data.length; i++){
                var diff = data[i].value - data[i-1].value;
                if(diff > 2) {
                    danger = data[i];
                    infraction++;
                }
            }
        }

        danger ? deferred.resolve([true, danger, infraction]) : deferred.resolve([false, readings, infraction]);
    })
    .catch(deferred.reject);

    return deferred.promise;
};
