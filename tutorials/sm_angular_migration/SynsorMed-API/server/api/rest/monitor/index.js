'use strict';

var router = require('express').Router();
var _ = require('lodash');

var models = require('models');
var moment = require('moment');
var fs = require('fs');
var Json2csvParser = require('json2csv').Parser;
var MonitorModel = models.Monitor;
var PatientModel = models.Patient;
var NotificationsModel = models.Notifications;
var UserModel = require('models').User;
var MonintorMarshaller = require('../../../dto/monitor');
var UniqueCode = require('../../../components/unique');

var Errors = require('errors');
var logger = require('logger');


var checkPatientOfProvider = function(req, res, next){
    var patientId = req.body.patientId;
    var providerId = req.body.providerId ? parseInt(req.body.providerId) : req.session.userId;

    // if patientId is not set
    if(!patientId) return next();

    PatientModel.findOne({
        where: { id: patientId },
        include:[{
            model : UserModel
        }]
    })
    .then(function(patient){
        if(!patient || !patient.Users.length){
            throw new Errors.ValidationError('No patient found with id '+patientId);
        }
        var users = patient.Users;
        var isPatientOfUser = false;
        users.forEach(function(user){
            if(user.id == providerId){
                isPatientOfUser = true;
                return;
            }
        });
        if(isPatientOfUser){
          return next();
        }
        else{
            throw new Errors.ValidationError(patientId + ' is not a patient of user '+providerId);
        }
    })
    .catch(function(err){
       logger.error(err);
       logger.trace(err.message);
       res.status(500).send(JSON.stringify(err));
    });
};


var SecurityCheck = function(req, res, next) {
  if(req.session.userId || req.session.monitorCode) {
    next();
  } else {
    throw new Errors.SecurityError('Access to monitor denied - not authenticated ');
  }
};

router.use(SecurityCheck);

//create new monitor
router.post('/', checkPatientOfProvider, function(req, res){
    if(!req.body.providerId) {
        req.body.providerId = req.session.userId;
    }
    if(!req.body.providersId){
      req.body.providersId = [req.session.userId];
    }

    var monitor = MonitorModel.build(MonintorMarshaller.unmarshal(req.body));

    UniqueCode
    .generateUniqueCode()
    .then(function(code){
        monitor.patient_code = code;
        return monitor.save();
    }).then(function(monitorData){
        logger.trace('Monitor created with id = '+monitorData.id);
        res.json(monitorData);
    }).catch(function(e){
      logger.error(e);
      res.status(500).send(JSON.stringify(e));
    });

});

var monitorItem = require('express').Router({mergeParams: true});

monitorItem.use(function (req, res, next) {
  var paranoid = true;
  if(req.query.permanentDelete){
    paranoid = false;
  }

    MonitorModel.find({
      where: {id: req.params.monitorId},
      include: [UserModel],
      paranoid: paranoid
    }).then(function (monitor) {
        if (!monitor) {
            throw new Errors.HTTPNotFoundError('No monitor found for monitor id ' + req.params.monitorId);
        }

        if(req.session && req.session.monitorCode && req.current_user.org_id && monitor.User.org_id != req.current_user.org_id && monitor.patient_code != req.session.monitorCode) {
            throw new Errors.SecurityError('User not authorized');
        }

        req.monitorModel = monitor;
        next();
    }).catch(function (err) {
      res.status(500).json(err);
      throw new Errors.SQLExceptionError(err);
    });
});

monitorItem.get('/', function(req, res){
    MonintorMarshaller.marshal(req.monitorModel).then(function(data){
        res.json(data);
    });
});

monitorItem.put('/', checkPatientOfProvider, function(req, res){
  console.log('req.session.userId',req.session.userId)
  console.log("**** the req.body is before unmarshal: " + JSON.stringify(req.body));
    var monitorFromJSON = MonintorMarshaller.unmarshal(req.body);

    if(!req.session.userId) {
        monitorFromJSON = _.pick(monitorFromJSON, ['terms_accepted', 'auto_fetch', 'notify_requested']);
        console.log("*** I was able to do the pick: " + JSON.stringify(monitorFromJSON));
    }

    return MonitorModel.findById(req.params.monitorId).then(function (monitor) {
        console.log("**** I was able to findById");
        if (monitorFromJSON.notify_requested && !req.session.userId) {
            monitorFromJSON.note = JSON.parse(monitor.note || '[]');
            monitorFromJSON.note.push({
                text: 'Patient requests a call.',
                date: moment().format(),
                isNotify: true
            });
            console.log("**** After unmarshal but before stringify: " + JSON.stringify(monitorFromJSON));
            monitorFromJSON.note = JSON.stringify(monitorFromJSON.note);
        }
        console.log("*** After stringify but before DB update: " + JSON.stringify(monitorFromJSON));
        return monitor.update(monitorFromJSON).then(function (updatedMonitor) {
          console.log("*** I was able to update monitor with monitorFromJSON");
            logger.trace('Monitor ' + updatedMonitor.id + ' updated');
            if(req.body.addNote){
              NotificationsModel.find({where:{monitor_id: updatedMonitor.id}})
              .then(function(notification){
                if(!notification){
                  return NotificationsModel.build({
                    monitor_id : updatedMonitor.id,
                    type: 'note'
                  }).save();
                }
                else{
                  notification.updateAttributes({read_by: null});
                }
              })
              .catch(function(err){
                console.log('err', err)
              });
            }
            if(req.body.seenNotes){
              NotificationsModel.find({
                where:{monitor_id: updatedMonitor.id}
              })
              .then(function(notification){
                if(notification && notification.read_by){
                  var readBy = JSON.parse(notification.read_by);
                  if(readBy.indexOf(req.session.userId) != 1){
                    readBy.push(req.session.userId)
                  }
                  notification.updateAttributes({read_by: JSON.stringify(readBy)});
                }
                else{
                  notification.updateAttributes({read_by: JSON.stringify([req.session.userId])});
                }
              })
              .catch(function(error){
                console.log('error', error)
              });
            }
            return MonintorMarshaller.marshal(updatedMonitor).then(function(monitorJSON){
                return res.json(monitorJSON);
            });
        });
    }).catch(function(e){
      console.log("*** there was an error: " + JSON.stringify(e));
        logger.error(e);
        res.status(500).json(e);
    });
});

//unlink the monitor by clearing its oauth data from all measurements
monitorItem.delete('/unlink/:measurementId?', require('./unlink'));

monitorItem.delete('/', function(req, res){
    var monitorId = req.params.monitorId;
    var user = JSON.parse(req.query.user);
    var userId = user.id;
    var role = user.role.toLowerCase();
    var force = false;
    if(req.query.permanentDelete){
      force = true;
    }
    if(user && role && role == 'provider'){
      MonitorModel.findById(monitorId)
      .then(function (monitor) {
        var providersId = JSON.parse(monitor.providers_id);
        if(monitor && providersId && providersId.length > 1){
          _.forEach(providersId, function(providerId, index){
            if(userId == providerId && providersId.indexOf(userId) != -1){
              providersId.splice(index,1)
            }
          })
          monitor.update({
            providers_id : JSON.stringify(providersId)
          })
          .then(function(deleted){
            logger.trace('Monitor ' + deleted.id + ' deleted');
            return res.json({success: true});
          })
          .catch(function(e){
            logger.error(e);
            return res.status(500).json({success: false});
          });
        }
        else{
          req.monitorModel
          .destroy()
          .then(function(deleted){
            logger.trace('Monitor ' + deleted.id + ' deleted');
            return res.json({success: true});
          })
          .catch(function(e){
            logger.error(e);
            return res.status(500).json({success: false});
          });
        }
      });
    }
    else{
      req.monitorModel
      .destroy({ force: force })
      .then(function(deleted){
        logger.trace('Monitor ' + deleted.id + ' deleted');
        return res.json({success: true});
      })
      .catch(function(e){
        logger.error(e);
        return res.status(500).json({success: false});
      });
    }
    // req.monitorModel
    // .setMeasurements([])
    // .then(function(){
    //   req.monitorModel
    //   .destroy({ force: force })
    //   .then(function(deleted){
    //     logger.trace('Monitor ' + deleted.id + ' deleted');
    //     return res.json({success: true});
    //   })
    // })
    // .catch(function(e){
    //   logger.error(e);
    //   return res.status(500).json({success: false});
    // });
});

// router.put('/:id', function(req, res){
//     MonitorModel.findOne({
//       where:{
//         id: req.params.id
//       },
//       paranoid: false
//     })
//     .then(function (monitor) {
//         monitor.restore()
//         .then(function(){
//            return res.status(200).send(true);
//         })
//     });
// });

router.get('/rpm-report', function (req, res) {
  var offset = req.query.offset;
  var startDate = moment(new Date(req.query.startDate)).utc().format();
  var endDate = moment(new Date(req.query.endDate)).utc().format();
  var org_id;

  if (req.query.orgId) {
    org_id = req.query.orgId;
  } else {
    org_id = req.current_user.org_id;
  }

  MonitorModel
    .findAll({
      where: {
        updated_at: { $between: [startDate, endDate] },
      },
      include: [{
        model: PatientModel
      }, {
        model: UserModel,
        where: { org_id: org_id }
      }]
    })
    .then(function (patients) {
      var result = [];

      patients.forEach(function (patient) {
        var patientCode = patient.patient_code;
        var firstName = patient.Patient ? patient.Patient.first_name : 'N/A';
        var lastName = patient.Patient ? patient.Patient.last_name : 'N/A';
        // var monitorStartDate = patient.start_date;
        var note = [];

        try {
          note = JSON.parse(patient.note);
        } catch (e) {
          console.error(e);
          note = [];
        }
        if(note && note.length !=0){
          var lastNoteTime = false;
          var Sum = 0;
          for(var i = 0; i<note.length;i++){
             if(lastNoteTime == false)
              lastNoteTime = note[i].date;
             if(lastNoteTime && new Date(lastNoteTime)<new Date(note[i].date) )
              lastNoteTime = note[i].date;

            var range = moment(new Date(note[i].date)).isBetween(startDate, endDate, null, '[)');
            if(range) Sum +=(note[i].duration || 0);
          }
          var lastNoteDate = lastNoteTime;
        }

        if(note && note.length>0 ){
          result.push({
            firstName: firstName,
            lastName: lastName,
            patientCode: patientCode,
            lastNoteDate: lastNoteDate?moment(lastNoteDate).utc().add(-1*offset, 'minutes').format('MM/DD/YYYY'):'N/A',
            time: Sum,
            noteCount : note ? note.length : 0
          });
        }
      });

      var fields = ['patientCode', 'firstName', 'lastName', 'lastNoteDate', 'time', 'noteCount'];
      var json2csvParser = new Json2csvParser({ fields: fields });
      var csv = json2csvParser.parse(result);
      var file = process.cwd() + '/server/tmp/rpm_report.csv';
      var files = fs.createWriteStream(file);
      files.write(csv);

      if (result && result.length) {
        res.json(true);
      } else {
        res.json(false);
      }
    })
    .catch(function (error) {
      logger.error(error);
      logger.trace(error.message);
      res.status(500).send(JSON.stringify(error));
    });
});

router.use('/billing/report', require('./billing'));
router.use('/:monitorId', monitorItem);
router.use('/:monitorId/token', require('./token'));
router.use('/:monitorId/measurements', require('./measurements'));
router.use('/:monitorId/documents', require('./documents'));
router.use('/:monitorId/services', require('./services'));
router.use('/:monitorId/appointment', require('./encounter'));
router.use('/:monitorId/leaderboard', require('./leaderboard'));

module.exports = router;
