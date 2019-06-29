'use strict';

var moment = require('moment');
var logger = require('logger');
/**
 * Update an monitor with reading, set it to use next reading date
 *
 * Resolve(true) : It worked, update is done
 * Resolve(false) : It falied, due to validations
 * Reject(error) : Update rejected with Error
 */
module.exports = function(measurement, reading, readingDate, serialNumber, prevReading){
    reading = reading ?  JSON.stringify(reading) : null; //convert to a string
    prevReading = prevReading ? JSON.stringify(prevReading) : null;
    readingDate = moment.unix(readingDate).format('D MMM YYYY HH:mm:ss').toString();
    logger.debug('We are reading for ' + readingDate);
    logger.debug('Repeat interval was ' + measurement.repeat_within_seconds);
    logger.trace('Crone Job : Updating measurement latest_reading and last_recorded field for id ' + measurement.id);
    return measurement
    .updateAttributes({
        latest_reading: reading,
        last_recorded: new Date(),
        serial_number: serialNumber ? serialNumber : measurement.serial_number,
        prev_reading: prevReading
    });
};
