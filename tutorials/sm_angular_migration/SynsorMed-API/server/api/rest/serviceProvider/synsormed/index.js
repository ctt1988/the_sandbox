'use strict';

var _ = require('lodash');
var models = require('models');
var router = require('express').Router({mergeParams: true});
var dto = require('../../../../dto/serviceData');
var measurementDto = require('../../../../dto/measurement');

router.get('/', function(req, res){
    var code = req.query.patientCode || req.session.monitorCode;
    if(!code){
        return res.status(422).send({message: 'monitor code is required'});
    }
    models.Service.findOne({
        where: {
            name: 'synsormed'
        },
        include: [{
            require: true,
            model: models.Measurement,
            include: [{
                require: true,
                model: models.Monitor,
                where: {
                   patient_code: req.session.monitorCode
                }
            }]
        }]
    })
    .then(function(result){
        var measurements = _.map(result.Measurements, function(measurement){
            return measurementDto.marshal(measurement);
        });
        return res.json(measurements);
    })
    .catch(function(err){
        return res.status(500).send(err);
    });
});

router.post('/', function (req, res){
    var dataObj = dto.unmarshal(req.body);
    var dataKeys = dataObj.data ? Object.keys(dataObj.data) : [];
    if(!dataObj.monitor_id) return res.status(422).send({message: 'monitor_id is required'});

    models.ServiceData.findOrCreate({
        where: {
             monitor_id: dataObj.monitor_id
        }
    })
    .spread(function(entry){
        var data = entry.service_data ? JSON.parse(entry.service_data) : {};
        _.forEach(dataKeys, function(dataKey){
              var freshData = data[dataKey] || [];
              freshData.push(dataObj.data[dataKey]);
              data[dataKey] = freshData;
        });
        return entry.updateAttributes({
            service_data: JSON.stringify(data),
            service_name: dataObj.service_name
        })
        .then(function(){
            return res.send(true);
        });
    })
    .catch(function(err){
        console.log(err);
        return res.status(500).send(err);
    });
});

module.exports = router;
