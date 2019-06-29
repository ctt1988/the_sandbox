'use strict';

var Q = require('q');
var _ = require('lodash');
var models = require('models');
var MeasurementModel = models.Measurement;
var ServiceModel = models.Service;
var MeasurementServiceModel = models.MeasurementService;
var driverReader = require('../../api/service/drivers');

//link a service with its measurement
exports.linkServiceMeasurement = function(services){
    var promises = [];
    services.forEach(function(service){
        var tempPromise = Q.defer();
        var tempService = _.omit(service, 'provides');
        tempService = _.omitBy(tempService, _.isUndefined); //!important to remove undefined keys from object
        tempService.version = tempService.version.toString();
        var serviceObj = null;

        ServiceModel.findOrCreate({where: tempService}) //remove the provides key from services first
        .then(function(tempServiceObj){
            serviceObj = tempServiceObj;
            if(_.isEmpty(serviceObj)) return tempPromise.resolve();
            return MeasurementModel.findAll({
                where: {
                    name: {
                        '$in': service.provides
                    }
                }
            });
        })
        .then(function(measurements){
            if(_.isEmpty(measurements)) return tempPromise.resolve();
            return serviceObj[0].setMeasurements(measurements);
        })
        .then(function(){
            return tempPromise.resolve();
        })
        .catch(function(e){
            return tempPromise.reject(e);
        });

        promises.push(tempPromise.promise);
    });
    return Q.all(promises);
};

//Read measurement from configuration file
exports.getMeasurements = function(){
    var deferred = Q.defer();
    var filePath = require('path').join(__dirname, 'measurements.json');
    require('fs').readFile(filePath, 'utf8', function(err, data){
        if(err) return deferred.reject(err);
        else  return deferred.resolve(JSON.parse(data));
    });
    return deferred.promise;
};

// Reinit the database with new measurement and service entries
exports.resetDatabase = function(measurements, services){
    var deferred = Q.defer();
    Q.all([ //Clean the tables
        MeasurementServiceModel.destroy({truncate: true}),
        ServiceModel.destroy({truncate: true}),
        MeasurementModel.destroy({truncate: true})
    ])
    .then(function(){
        return Q.all([  //regenerate them again
            ServiceModel.sync(),
            MeasurementModel.sync(),
            MeasurementServiceModel.sync()
        ]);
    })
    .then(function(){
        return Q.all([  //add new records
            MeasurementModel.bulkCreate(measurements),
            ServiceModel.bulkCreate(services)
        ]);
    })
    .then(function(){
        return deferred.resolve();
    })
    .catch(function(e){
        return deferred.reject(e);
    });
    return deferred.promise;
};

/* Bootstrap the Service and Measurements */
exports.setupServicesMap = function(){
    var deferred = Q.defer();
    Q.all([exports.getMeasurements(), driverReader.readServices()])
    .spread(function(measurements, services){
        return exports.resetDatabase(measurements, services)
        .then(function(){
            return exports.linkServiceMeasurement(services);
        });
    })
    .then(function(){
        return deferred.resolve();
    })
    .catch(function(e){
        return deferred.reject(e);
    });
    return deferred.promise;
};
