var logger = require('logger');
module.exports = function(measurement, value){
    logger.debug('Crone Job : Setting Infraction ' + value + ' for MM id ' + measurement.id);
    return measurement.updateAttributes({
        infraction: parseInt(value)
     });
};
