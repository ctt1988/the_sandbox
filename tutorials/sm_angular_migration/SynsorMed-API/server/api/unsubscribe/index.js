'use strict';
var models = require('models');
var logger = require('logger');
var Errors = require('errors');
var PatientModel = models.Patient;
var router = require('express').Router();

var getTenDigitMobileNumber = function(mobileNumber){
    if(!mobileNumber) return false;
    var result, helper = 0;
    for(var i=0; i<10; i++){
        var remender = mobileNumber % 10;
        result = (result != undefined) ? (remender*helper)+result : remender;
        mobileNumber = parseInt(mobileNumber/10);
        helper = helper ? helper * 10 : 10;
    }
    return result;
};

router.all('/', function(req, res){
   var content = req.body.Text || req.query.Text;
       content = content ? content.replace(/ /g, '') : false;
   var from = req.body.From || req.query.From;
       from = getTenDigitMobileNumber(from);

    if(content != 'STOP'){
        throw new Errors.BadRequestError('Invalid Keyword');
    }

    PatientModel.update({notify: 0}, {
        where: {
            phone_mobile: from
        }
    })
    .spread(function(affectedCount) {
        if(affectedCount) logger.debug('Mobile no '+from+' unsubscribed from synsormed progress alerts.');
        return res.status(200).send(true);
    })
    .catch(function(error){
        logger.error(error);
        return res.status(200).send(true);
    });
});

module.exports = router;
