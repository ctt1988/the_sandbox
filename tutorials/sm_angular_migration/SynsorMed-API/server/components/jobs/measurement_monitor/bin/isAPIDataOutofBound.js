'use strict';

var Q = require('q');
var isOutOfBoundRule = require('../../../../rules/monitor').isOutOfBound;

/**
 * Check from the readings if the any reading was out of range
 *
 * Resolve(true, reading) : yes some blocks reading was out of bound
 * Resolve(false, reading) : Data was perfect and no one was out of range
 * Reject(error) : Error state
 */
module.exports = function(readings, upperbound, lowerbound, sensitivity, infraction){
    var deferred = Q.defer();
    var isOut, outofBoundReading;

    //by default sensitivity is 1 , means ignore no invalid reading
    sensitivity = sensitivity || 1;
    infraction = infraction || 0;

    for(var i = 0; i < readings.length; i++)
    {
      isOut = isOutOfBoundRule(upperbound, lowerbound, readings[i].value);
      if(isOut)
      {
          infraction++;
          outofBoundReading = readings[i];
          if(infraction >= sensitivity){
              break;
          }
      }
      else {
          //get latest reading
          outofBoundReading = readings[0];
      }
    }

    deferred.resolve([isOut, outofBoundReading, infraction]);
    return deferred.promise;
};
