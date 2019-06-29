'use strict';

var router = require('express').Router();
var quickBlox = require('server/components/quick-blox');
var logger = require('logger');

router.get('/', function (req, res) {
    var encounter = req.encounterModel;
    var qbDetails;
    quickBlox.getUser(encounter.patient_code)
    .then(function(userInfo){
        qbDetails = userInfo;
        return quickBlox.getSessionToken();
    })
    .then(function(token){
        qbDetails.token = token;
        return res.json(qbDetails);
    })
    .catch(function(err){
        console.log(err);
        logger.trace(err);
        if(err.code == 404) return res.status(404).send(err);
        else return res.status(401).send(err);
    });
});

router.get('/push', function(req, res){
    var encounter = req.encounterModel;
    quickBlox.sendPushNotification(encounter.patient_code)
    .then(function(userInfo){
        console.log('userInfo', userInfo);
        return res.send(userInfo);
    })
    .catch(function(err){
        console.log('err', err);
        return res.status(401).send(err);
    });
});

module.exports = router;
