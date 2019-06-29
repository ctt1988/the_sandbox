'use strict';

var Q = require('q');
var _ = require('lodash');
var models = require('models');
var logger = require('logger');
var config = require('config');
var Errors = require('errors');
var parseResult = require('./result');
var monitorDto = require('../../../../dto/monitor');
var router = require('express').Router({mergeParams: true});

router.get('/search', function(req, res){
    var keyword = req.query.keyword;
    if(!keyword ||  req.current_user.role_id != config.get('seeds.roles.Admin')) return res.status(401).send(false);

    models.Monitor.findAll({
        where: ['`Monitor`. `deleted_at` IS NULL AND (`Monitor`.`patient_code` LIKE "%'+keyword+'%" OR `Patient`.`first_name` LIKE "%'+keyword+'%" OR `Patient`.`last_name` LIKE "%'+keyword+'%")'],
        include: [models.Patient, {
            required: true,
            model: models.User,
            include: {
                required: true,
                model: models.Organization,
                where:{
                    id: req.current_user.org_id
                }
            }
        }]
    })
    .then(function(results){
        var promises = [];
        _.forEach(results, function(result){
            promises.push(monitorDto.marshal(result));
        });
        return Q.all(promises);
    })
    .then(function(monitors){
        return res.json(monitors);
    })
    .catch(function(err){
        return res.status(500).send(err);
    });
});

router.get('/', function(req, res){
    var monitorId = req.query.monitorId;
    if(!monitorId ||  req.current_user.role_id != config.get('seeds.roles.Admin')) return res.status(401).send(false);

    models.Monitor.findOne({
        where: {
            id: monitorId
        },
        include: [{
            require: true,
            model: models.User,
            include: [{
                require: true,
                model: models.Organization,
                where:{
                    id: req.current_user.org_id
                }
            }]
         },
         models.Patient,
         models.Measurement
        ]
    })
    .then(function(result){
        if(!result) throw new Errors.HTTPNotFoundError('No monitor found with monitorId '+monitorId);
        return parseResult(result)
        .then(function(parsedData){
            return res.json(parsedData);
        });
    })
    .catch(function(err){
        logger.error(err);
        if(err instanceof Errors.HTTPNotFoundError) return res.status(404).send(err);
        res.status(500).send(err);
    });
});

module.exports = router;
