'use strict';
var path = require('path');
var Errors = require('errors');
var crypto = require('crypto');
var models = require('models');
var logger = require('logger');
var router = require('express').Router();
var storage = require('../../components/storage');

router.use('/pdf', require('./pdf'));

router.get('/token', function(req, res){
    var monitorId = req.query.monitorId;
    var fileName = req.query.fileName;
    var diseasesId = req.query.diseasesId;
    if(!monitorId || !fileName || !diseasesId){
        return res.status(422).send(false);
    }
    var info = {monitorId: monitorId, fileName: fileName, diseasesId: diseasesId};
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

router.get('/:token/:fileName', function(req, res){
    var token = req.params['token'];
    var file = req.params['fileName'];
    if(!token) return res.status(422).send(false);

    var monitor, monitorId, diseasesId, fileName, orgId ;

    storage.get(token)
    .then(function(info){
        if(!info) return res.status(422).send(false);
        monitorId = parseInt(info.monitorId);
        diseasesId = parseInt(info.diseasesId);
        fileName = info.fileName;
        return storage.clear(token);
    })
    .then(function(){
        return models.Monitor.find({
            where: {id: monitorId},
            include: [models.User]
        });
    })
    .then(function(results){
        if (!results) {
            throw new Errors.HTTPNotFoundError('No monitor found for monitor id ' + monitorId);
        }
        monitor = results;
        orgId = monitor.User.org_id;
        return models.Diseases.findOne({where:{id: diseasesId}});
    })
    .then(function(disease){
        var diseaseName = disease.name.toLowerCase();
        file = file ? file : fileName;
        var filePath = path.join(path.dirname(require.main.filename), '/documents/'+diseaseName+'/'+orgId+'/'+fileName);
        res.download(filePath);
    })
    .catch(function(error){
        console.log(error);
        logger.trace(error);
        res.status(422).send(false);
    });
});

module.exports = router;
