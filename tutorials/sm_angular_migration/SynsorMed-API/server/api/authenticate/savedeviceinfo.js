'use strict';

var Q = require('q');
var models = require('models');
var logger = require('logger');

module.exports = function(object_type, object_id, deviceInfo){
    var defer = Q.defer();
    if(!deviceInfo || !object_id) defer.resolve();
    var info = {
        platform: deviceInfo.platform,
        device_id: deviceInfo.uuid,
        registration_id: deviceInfo.registrationId || null
    };
    models.Device.findOne({
        where: {
            object_type: object_type,
            object_id: object_id
        }
    })
    .then(function(record){
        if(!record){
            return models.Device.create({
                object_type: object_type,
                object_id: object_id,
                info: JSON.stringify(info)
            });
        }
        return record.updateAttributes({info: JSON.stringify(info)});
    })
    .then(defer.resolve)
    .catch(function(err){
        logger.trace(err);
        defer.reject();
    });

    return defer.promise;
};
