'use strict';

var pdfs = require('../../pdfs');
var Errors = require('errors');
var crypto = require('crypto');
var models = require('models');
var logger = require('logger');
var router = require('express').Router();
var storage = require('../../components/storage');
var parseResult = require('../rest/report/summary/result');

router.get('/token', function(req, res){
    var monitorId = req.query.monitorId;
    if(!monitorId){
        return res.status(422).send(false);
    }
    var info = {monitorId: monitorId};
    crypto.randomBytes(48, function(err, buffer) {
        var token = buffer.toString('hex');
        storage.set(token, info)
        .then(function(){
            res.send(token);
        })
        .catch(function(error){
            logger.trace(error);
            console.log(error);
            res.status(422).send(false);
        });
    });
});

router.get('/:token/:monitorId', function(req, res){
    var token = req.params['token'];
    var monitorId;
    if(!token) return res.status(422).send(false);

    storage.get(token)
    .then(function(info){
        if(!info) return res.status(422).send(false);
        monitorId = parseInt(info.monitorId);
        return storage.clear(token);
    })
    .then(function(){
        return models.Monitor.findOne({
            where: {
                id: monitorId
            },
            include: [{
                require: true,
                model: models.User,
                include: [{
                    require: true,
                    model: models.Organization
                }]
             },
             models.Patient,
             models.Measurement
            ]
        });
    })
    .then(function(result){
        if(!result) throw new Errors.HTTPNotFoundError('No monitor found with monitorId '+monitorId);
        return parseResult(result)
        .then(function(parsedData){
            return pdfs.patientSummaryReport(res, parsedData);
        })
        .then(function(stream){
            return res.download(stream.path);
        });
    })
    .catch(function(error){
        console.log(error);
        logger.trace(error);
        if(error instanceof Errors.HTTPNotFoundError) return res.status(404).send(error);
        res.status(422).send(false);
    });
});

module.exports = router;
