'use strict';

var models = require('models');
var logger = require('logger');
var router = require('express').Router({mergeParams: true});
var quickBlox = require('server/components/quick-blox');

router.get('/', function (req, res) {
    var providerId = parseInt(req.params['providerId']);
    var quickBloxDetails = null;
    models.User.findById(providerId)
    .then(function(user){
        return quickBlox.getUser(user.email);
    })
    .then(function(userInfo){
        quickBloxDetails = userInfo;
        return quickBlox.getSessionToken();
    })
    .then(function(token){
        quickBloxDetails.token = token;
        return res.send(quickBloxDetails);
    })
    .catch(function(err){
        console.log(err);
        logger.trace(err);
        res.status(404).send(err);
    });
});

module.exports = router;
