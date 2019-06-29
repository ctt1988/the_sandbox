'use strict';

var models = require('models');
var UserModel = models.User;
var PatientModel = models.Patient;
var MonitorModel = models.Monitor;
var RoleModel = models.Role;
var RTCUserModel = models.RTCUser;
var Errors = require('errors');
var logger = require('logger');
var router = require('express').Router();
var WeemoAuth = require('server/components/weemo/weemo.auth');


var patientListSecurity = function (req, res, next) {
    if(!req.session.userId) {
        res.status(401).end();
        return;
    }
    UserModel.find({where: {id: req.session.userId}, include: [RoleModel]}).then(function (user) {
        if(req.params.providerId != req.session.userId && user.Role.name != 'Admin') {
            res.status(401).end();
            return;
        }
        next();
    }).catch(function () {
        res.status(500).end();
    });

};

router.get('/:providerId/token', patientListSecurity, function (req, res) {
    logger.debug('Looking for available token');
    var inactiveDate = new Date();
    inactiveDate.setMinutes(inactiveDate.getMinutes() - 5);
    return RTCUserModel.find({
        where: {
            $or: [
                {last_activity: null},
                {last_activity: {$lt: inactiveDate}}
            ]
        }
    }).then(function (user) {
        if(!user) {
            throw new Errors.HTTPNotFoundError('Could not find open token');
        }
        return WeemoAuth.auth(user.name, user.domain, user.profile).then(function (token) {
            req.session.rtccode = user.name;
            res.send(token);
        });
    });
});

router.delete('/:providerId/token', patientListSecurity, function (req, res) {
    req.session.rtccode = null;
    res.status(204).end();
});

router.put('/:id', function(req, res){
  PatientModel.findOne({
    where:{
      id: req.params.id
    },
    paranoid: false
  })
  .then(function (monitor) {
      monitor.restore()
      .then(function(){
         return res.status(200).send(true);
      })
  });
});

router.use('/:providerId/worklist', patientListSecurity, require('./worklist'));
router.use('/:providerId/monitor', patientListSecurity, require('./monitor'));
router.use('/:providerId/patient', patientListSecurity, require('./patient'));
router.use('/:providerId/quickBloxDetails', require('./quickBloxDetails'));

module.exports = router;
