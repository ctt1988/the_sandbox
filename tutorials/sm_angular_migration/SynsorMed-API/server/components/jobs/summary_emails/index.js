'use strict';

var asyncMod = require('async');
var logger = require('logger');
var Q = require('q');
var scheduler = require('../index');
var bin = require('./bin');
var config = require('config');
var _ = require('lodash');
var models = require('models');
var MeasurementMonitorModel = require('models').MeasurementMonitor;
var OauthMonitorTokenModel = require('models').OauthMonitorToken;
var MonitorModel = require('models').Monitor;
var UserModel = require('models').User;
var OrganizationModel = require('models').Organization;
var OrganizationPreferenceModel = require('models').OrganizationPreference;
var moment = require('moment');
/**
* Divide all the monitors into blocking and non blocking queues.
* Process them at same time in different workers
*/
var getPatientCodes = function (summaryData) {
  
  var sampleProviderList = [];
  var allData = [];
  var finalData = {};
  var apiQueue = {};
  var deferredAPI = [];
  apiQueue["summaryEmails"] = [];

  // Go through each monitor and classify if highrisk or surveynotGiven
  _.forEach(summaryData,function(data,index){
    var monitorData = {};
    monitorData["highRisk"] = false;
    monitorData["surveyNotGiven"] = false;
    if(!data.oauth_data || !data.Monitor){
      console.log("*** During job and getPatientCodes, the oauth_data or monitor was null");
      return;
    }
    var result = null;
    try{
      result = JSON.parse(data.oauth_data);
    }
    catch(err){
      logger.error("*** Error parsing to json with in getPatientCodes: " + JSON.stringify(err));
    }
    if(result == null){
      if(data.Monitor.patient_code){
        monitorData.surveyNotGiven = true;
      }
      return;
    }
    var totalScore = 0
    _.forEach(result.status, function (data, index) {
      if (new Date(moment(data.endDate).startOf('day')).valueOf() == new Date(moment().startOf('day').subtract(1, 'day')).valueOf()) {
        totalScore = totalScore + parseInt(data.choice);
      }
    });
    if (totalScore > 17 && data.Monitor.patient_code) {
      monitorData.highRisk = true;;
    }
    var dayDifference =  moment().startOf('day').diff(moment(data.last_sync).startOf('day'), 'days');
    if (dayDifference > 1 && data.Monitor.patient_code) {
      monitorData.surveyNotGiven = true;
    }

    //Get one (the first) of the provider IDs so we can find the orgID
    //We can only tell what org a monitor belongs to by looking at it's provider list
    var sampleProviderID = JSON.parse(data.Monitor.providers_id)[0];
    monitorData["sampleProvider"] = sampleProviderID;

    monitorData["patientCode"] = data.Monitor.patient_code;

    allData.push(monitorData);

  });

  //Now that we have all of the monitors classified, we need to get their associated orgIDs
  //so that we'll know what org_emails to send to.
  var idArray = [];
  _.forEach(allData, function(data,index){
    idArray.push(data.sampleProvider);
  });
  //remove duplicates
  idArray = _.uniq(idArray);

  UserModel.findAll({
    attributes:['id','org_id'],
    where:{
      id: {
        $in : idArray
      }
    },
    include:{
      model:OrganizationModel,
      required:true,
      include:{
        model:OrganizationPreferenceModel,
        required:true,
        attributes:['value'],
        where:{
          key:"orgEmails"
        }
      }
    }
  })
  .then(function(results){
    _.forEach(allData, function(data,index){
      var highRiskPatientList = [];
      var surveyNotGivenList = [];
      var currProvider = data.sampleProvider;
      var currOrg = null;
      var currEmails = null;
      _.forEach(results,function(data,index){
        if(currProvider == data.id){
          currOrg = data.org_id;
          currEmails = data.Organization.OrganizationPreferences[0].value;
        }
      })

      if(currOrg){ //This means that we were able to find an org with orgemails specified
        if(!finalData[currOrg]){ //This means to create an empty object if one didn't already exist
          finalData[currOrg] = {};
          finalData[currOrg]["highRisk"] = [];
          finalData[currOrg]["surveyNotGiven"] = [];
        }
        
        if(data.highRisk){
          finalData[currOrg]["highRisk"].push(data.patientCode);
        }
        if(data.surveyNotGiven){
          finalData[currOrg]["surveyNotGiven"].push(data.patientCode);
        }

        finalData[currOrg]["orgEmails"] = currEmails;
      }
    });

    apiQueue["summaryEmails"].push(function(callback){
        bin.checkByAPI(finalData)
        .then(function(data){
          callback(null, data);
        })
        .catch(function(e){
          logger.trace(e.message);
          callback(e, null);
        });
      });

    //Main queue, which finishes when all queues are done
    var deferredAPI = [];

    _.forEach(apiQueue, function(queue, service){
        var currentQueuePromise = Q.defer();
        asyncMod.parallelLimit(queue, config.get('cron.parallelLimit'), function(err, results){
            if(err){
                currentQueuePromise.reject(err);
            } else {
                currentQueuePromise.resolve(results);
            }
        });
        deferredAPI.push(currentQueuePromise.promise);
    });

  });

    //run queue
    return Q.allSettled(deferredAPI);
};
/**
* Cron Job logic, It pick all monitor , get API data and will then report missed/out of range monitors
*/

var task = function () {
  return OauthMonitorTokenModel.findAll({
    attributes:['oauth_data','monitor_id','service_name','last_sync'],
    where: {
      service_name: 'survey'
    },
    include: [{
      model: MonitorModel,
      required: true,
      attributes: ['patient_code', 'providers_id']
    }]
  })
    .then(function (summaryData) {
      return getPatientCodes(summaryData);
    }).catch(function (err) {
     logger.error(err);
    });
};
/**
 * Start the monitor cron job
 */
module.exports.beginExecution = function () {
  scheduler.everyNight(task, function () {
    logger.info('Survey Email Cron Job Done');
  }, function (e) {
    logger.error('Failed Survey Email Cron Job due to : ' + e);
  });
  logger.info('Survey Email Cron Setup: Done');
};
