'use strict';

var Q = require('q');
var _ = require('lodash');
var logger = require('logger');
var measurementDto = require('../../../dto/measurement');
var MonitorModel = require('models').Monitor;
var UserModel = require('models').User;
var PatientModel = require('models').Patient;
var router = require('express').Router();
var moment = require('moment');
var Json2csvParser = require('json2csv').Parser;
var fs = require('fs');

//Get the encounter linked
router.get('/', function(req, res){
  var measurementMap;
  var firstDate = req.query.startDate;
  var secondDate = req.query.endDate;
  var org_id = req.current_user.org_id;
  var offset = req.query.offset ? -1*req.query.offset : 0;
  var upperbound;
  var query = {
    include:[   {
                    model: PatientModel
                },
                {
                    model : UserModel,
                    where:
                        {
                            org_id : org_id
                        }
                    }
                ],
  };
  MonitorModel.findAll(query)
  .then(function(monitors){

    var promises = [];

    monitors.forEach(function(monitor){

      var patientCode = monitor.patient_code;
      var firstName = monitor.Patient ? monitor.Patient.first_name : 'N/A';
      var lastName = monitor.Patient ? monitor.Patient.last_name : 'N/A';
      var totalMinutes = 0;
      //added
      var total_amount_of_days = 0;
      var Bill = 'No';

      var promis = monitor.getMeasurementMaps()
        .then(function(measurementMapData){
          measurementMap = measurementMapData[0];
          if(_.isEmpty(measurementMap)) return false;
          upperbound= measurementMapData[0].upperbound || null;
          //measurementUnits = measurementDto.marshal(measurementMap.Measurement, upperbound);
          return measurementMap.getAuthData();
        })
        .then(function(allResults){
          var data = allResults;
          if(!data) return false;
          var service_name = data.service_name;
          if(service_name != 'survey'){
              return false;
          }
          var oauthData = JSON.parse(data.oauth_data);
          if(!oauthData) return false;
          if(!oauthData.status) return false;

          var status = oauthData.status;
          var billingResult = [];
          var note = [];

          try {
            note = JSON.parse(monitor.note);
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

              var range = moment(new Date(note[i].date)).isBetween(firstDate, secondDate, null, '[)');
              if(range) Sum +=(note[i].duration || 0);
            }
          }
          totalMinutes = typeof Sum !== 'undefined' ? Sum : 0;

          if(status && status.length){

            var start = new Date(firstDate);
            var end = new Date(secondDate);

            var date_ = new Date(start);
            while(date_ <= end){
              var lastStatusTime = false;
              var Sum = 0;
              for(var i = 0; i<status.length;i++){
                var statusDate =  moment(new Date(status[i].endDate)).add(offset, 'minutes').toDate();
                if(date_.toDateString() === statusDate.toDateString()){
                  if(lastStatusTime == false){
                      lastStatusTime = status[i].endDate;
                  }
                  if(lastStatusTime && new Date(lastStatusTime)<new Date(status[i].endDate) ){
                      lastStatusTime = status[i].endDate;
                  }
                  var range = moment(new Date(status[i].endDate)).isBetween(firstDate, secondDate, null, '[)');
                  if(range) Sum +=( parseInt(status[i].choice) || 0);
                }
              }
              var lastStatusDate = lastStatusTime;
              var index = moment(date_).format('M/D/YYYY');
              billingResult[index] = Sum;
              var newDate = date_.setDate(date_.getDate() + 1);
              date_ = new Date(newDate);
            }

          }

          var result_ = {};
          result_.patientCode = patientCode;
          result_.firstName  = firstName;
          result_.lastName  = lastName;
          for (var key in billingResult) {
              result_[key] = billingResult[key];

              if(result_[key]!= 0 ){
                total_amount_of_days+=1;
              }
              // console.log('Billing result',result_[key],billingResult[key], total_amount_of_days);
          }

          result_.totalMinutes  = totalMinutes;
          result_.total_amount_of_days = total_amount_of_days;
          // console.log(result_.total_amount_of_days);
          if(total_amount_of_days >= 16){
            Bill = 'Yes';
          }else {
            Bill = 'No';
          }

          result_.Bill = Bill;
          // console.log(result_.Bill);
          return JSON.parse(JSON.stringify(result_));
        });
        if(promis){
            promises.push(promis);
        }
    });

    return Q.all(promises)
      .then(function(allResults){
        var filteredResults = [];
        var fields = [];
        allResults.forEach(function(result){
          if(result){
            filteredResults.push(result);
            if(fields.length === 0){
              var temp = 0;
              for (var key in result) {
                fields[temp++] = key;
              }
            }
          }
        });

        var json2csvParser = new Json2csvParser({ fields: fields });
        var csv = json2csvParser.parse(filteredResults);
        var file = process.cwd() + '/server/tmp/billing_report.csv';
        var files = fs.createWriteStream(file);
        files.write(csv);

        if (filteredResults && filteredResults.length) {
          res.json(true);
        } else {
          res.json(false);
        }
      }).catch(function (error) {
        logger.error(error);
        logger.trace(error.message);
        res.status(500).send(JSON.stringify(error));
      });

  }).catch(function (error) {
    logger.error(error);
    logger.trace(error.message);
    res.status(500).send(JSON.stringify(error));
  });
});

module.exports = router;
