'use strict';

var _ = require('lodash');
var models = require('models');
var ServiceModel = models.Service;
var MeasurementModel = models.Measurement;
var router = require('express').Router({mergeParams: true});
var oauthMonitorDto = require('../../../dto/oauthMonitorToken');
var servicelist = require('../../../components/servicemap/servicelist');

router.get('/', function(req, res){
    ServiceModel.findAll({
        include: [{
            model: MeasurementModel,
            where: {
                id: req.query.measurementId
            }
        }]
    })
    .then(function(services){
       if(_.isEmpty(services)) return res.json([]);
       var final = [];
       services.forEach(function(d){
           final.push(servicelist.getService(d.name));
       });
       return res.json(final);
    });

});

router.get('/connected', function(req, res){
    var monitor = req.monitorModel;
    monitor.getOauthMonitorTokens()
    .then(function(measurements){
        if(!measurements) return res.status(404).send('Monitor has no measurements link');
        var arr = [];
        measurements.forEach(function(val){
            if(val.service_name.toLowerCase() != 'survey') arr.push(oauthMonitorDto.marshal(val));
        });
        return res.json(arr);
    })
    .catch(function(e){
        return res.status(500).json(e);
    });
});

router.get('/info', function(req, res){
    var rawServices = req.query.services;
    var services = rawServices ? rawServices.split(',') : [];
    ServiceModel.findAll({
        attributes: ['name', 'meta_data'],
        where: {
            name: {
                $in: services
            }
        }
    })
    .then(function(servicesData){
        var servicesInfo = [];
        _.forEach(servicesData, function(serviceData){
            var tmpObject = {};
            tmpObject.name = serviceData.name;
            tmpObject.meta_data = JSON.parse(serviceData.meta_data);
            //servicesInfo.push({ name: serviceData.name, meta_data: JSON.parse(serviceData.meta_data)});
            servicesInfo.push(tmpObject);
        });
        return res.json(servicesInfo);
    })
    .catch(function(err){
        console.log('err', err);
        return res.status(500).json(err);
    });
});

module.exports = router;
