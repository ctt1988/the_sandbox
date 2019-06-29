'use strict';

var url = require('url');
var _ = require('lodash');
var logger = require('logger');
var moment = require('moment');
var Errors = require('errors');
var models = require('models');
var reader = require('./reader');
var driver = require('../../../service/driver');
var jwt = require('../../../service/drivers/base/jwt');
var helper = require('../../../../components/jobs/measurement_monitor/bin/helpers');
var socketComponent = require('../../../../components/sockets');
var util = require('util');

var updateC5 = function(results, measurement, serviceName){
    var extraData = helper.getExtraData(results, serviceName);
    var serialNumbers = helper.getSerialNumbers(results, serviceName);
    var latestSN = helper.getLatestSerialNumber(serialNumbers);
    latestSN = _.isEmpty(latestSN) ? null : latestSN [Object.keys(latestSN)[0]];

    //if(!extraData || _.isEmpty(extraData)){
    //    throw new Errors.ValidationError('No alert data found for MeasurementMonitor ' + measurement.id);
    //}

    var extraReadings = helper.getLatestDecisionReadings(extraData, measurement.repeat_within_seconds);

    //if(_.isEmpty(extraReadings.latestAlarms)){
    //    throw new Errors.ValidationError('No current readings found for ' + measurement.Measurement.name + ' via MM Id / Service : ' + measurement.id + ' / ' + serviceName);
    //}

    return measurement.updateAttributes({
        latest_reading: extraReadings.latestAlarms ?  JSON.stringify(extraReadings.latestAlarms) : null,
        last_recorded: new Date(),
        serial_number: latestSN ? latestSN : measurement.serial_number,
        prev_reading: extraReadings.lastAlarms ? JSON.stringify(extraReadings.lastAlarms) : null
    });
};
/**
* Add oauth data to a measurement map table by finding it based on its measurmentId
* Set next reading and other flag based on oauth data
*
* @param measurmentId , Interger, Measurment id (glucose) for which oauth data will be added
*/

module.exports = function(req, res){
    var measurementId = req.params.monitorMeasurementId;
    var urlParsed = url.parse(req.url, true);
    var monitorId = req.params.monitorId;
    var monitor = req.monitorModel;
    var measurement = null;
    var data = req.body;
    var updateOauthOnly = urlParsed.query.oauthUpdateOnly;
    var oauthData = null;

    var validServices = ['fdk', 'and', 'nonin', 'synsortrack', 'healthkit', 'survey', 'c5', 'eclipse'];

    if(updateOauthOnly && typeof updateOauthOnly == 'string'){
        updateOauthOnly = updateOauthOnly.toLowerCase() == 'true';
    }

    if(_.isEmpty(data.service_name)) return res.status(400).send('Service Name not supplied');
    if(_.isEmpty(monitor)) return res.status(404).send('Monitor not found');


    monitor.getMeasurementMaps(measurementId) //get all the measurements for the monitor
    .then(function(ms){
        measurement = ms[0];
        if(_.isEmpty(measurement)) return res.status(404).send('Monitor Measurement link not found');


        return models.OauthMonitorToken.find({ where: {
            monitor_id: monitorId,
            service_name: data.service_name
        }});
    })
    .then(function(dataVal){
        if(!dataVal){
            if(_.isEmpty(data.service_name) || (data.service_name.toLowerCase() != 'synsortrack' && _.isEmpty(data.oauth_data))){
                throw new Errors.BadRequestError('Service data not supplied');
            }
            oauthData = jwt.decode(data.oauth_data); //decode the data if its encoded
            if(_.isEmpty(oauthData)){
              socketComponent.emitData('dataRecievedFromApp', {orgId:monitor.User.org_id});
            }
            return driver.formatData(data.service_name, oauthData)
            .then(function(formattedData){
                // if(formattedData && formattedData.status){
                //    socketComponent.emitData('dataRecievedFromApp', {orgId:monitor.User.org_id});
                // }
                console.log("*** In authdata.js from formattedData is: " + JSON.stringify(formattedData));
                oauthData = formattedData;
                return models.OauthMonitorToken.create({
                    service_name: data.service_name || null,
                    oauth_data: _.isEmpty(oauthData) ? null : (typeof oauthData == 'string') ? oauthData : JSON.stringify(oauthData)
                });
            })
            .then(function(oauthDataRes){
                oauthData = oauthDataRes.oauth_data ? JSON.parse(oauthDataRes.oauth_data) : null;
                return oauthDataRes.setMonitor(monitorId)
                .then(function(){
                    logger.trace('Created entry in OauthMonitorToken for monitorId '+monitorId);
                    var serviceName = data.service_name ? data.service_name.toLowerCase() : false;
                    if(serviceName && (validServices.indexOf(serviceName) != -1)){
                        return oauthDataRes.updateAttributes({last_sync: new Date()})
                        .then(function(){
                            return measurement.setOauthMonitorToken(oauthDataRes.id);
                        });
                    }
                    return measurement.setOauthMonitorToken(oauthDataRes.id);
                });
            });
        }
        else {
            oauthData = data.oauth_data ? jwt.decode(data.oauth_data) : jwt.decode(dataVal.oauth_data);
            if(_.isEmpty(oauthData)){
              socketComponent.emitData('dataRecievedFromApp', {orgId:monitor.User.org_id});
            }
            var serviceName = data.service_name ? data.service_name.toLowerCase() : false;
            if(serviceName && (validServices.indexOf(serviceName) != -1)){
                return driver.formatData(data.service_name, oauthData, dataVal.oauth_data)
                .then(function(formattedData){
                    // if(formattedData && formattedData.status){
                    //    socketComponent.emitData('dataRecievedFromApp', {orgId:monitor.User.org_id});
                    // }
                    oauthData = formattedData;
                    return dataVal.updateAttributes({
                        oauth_data: JSON.stringify(formattedData),
                        last_sync: new Date()
                    });
                })
                .then(function(){
                    logger.trace('Updated oauth data with id '+dataVal.id);
                    return measurement.setOauthMonitorToken(dataVal.id);
                });
            }
            else{
                return measurement.setOauthMonitorToken(dataVal.id);
            }
        }
    })
    .then(function(){
        var eventData = { service: data.service_name };
        return models.Event.createDataUploadEvent(monitor.id, eventData);
    })
    .then(function(){
        if(updateOauthOnly){ //skip if only oauth update
            logger.debug('Updating only Oauth Data');
            return true;
        }
        if(typeof oauthData === 'string') oauthData = JSON.parse(oauthData);

        //model instance to update in OAuth2 case
        oauthData.oauthModelInstance = measurement.oauth_id ? measurement.OauthMonitorToken : measurement;
        oauthData.all = true;
        return driver.getUserDetails(data.service_name, oauthData, measurement.Measurement.name); //fetch API data
    })
    .then(function(results){
        if(updateOauthOnly) return true;  //skip if only oauth update

        if(helper.isC5Measurement(data.service_name)){
            return updateC5(results, measurement, data.service_name);
        }

        if(_.isEmpty(results.data)){
            results.data = null;
            throw new Errors.ValidationError('No reading available from ' + data.service_name);
        }

        var readingObj = reader(measurement.Measurement, data.service_name, results, false);  //get latest reading and its date

        if(_.isEmpty(readingObj)){ //if cant read API data
            throw new Errors.ValidationError('No reading available from ' + data.service_name);
        }

        var readingDate = readingObj.date;
        var reading = readingObj.reading ? readingObj.reading.toString() : null;

        var minReadingDate = moment().subtract(measurement.repeat_within_seconds <= 86400
        ? 86400 : measurement.repeat_within_seconds, 'seconds'); //get the minimum allowed reading date

        //if the reading Date is below the required date then return
        // we will report the user that we need new reading
        if(minReadingDate.isAfter(moment(readingDate, 'D MMM YYYY'), 'day')){
            throw new Errors.ValidationError('Please sync your ' +data.service_name+ ' with more recent data. Last reading was on: ' + readingDate);
        }

        return measurement.updateAttributes({
            latest_reading: reading,
            last_recorded: new Date()
        });
    })
    .then(function(){
        logger.trace('latest_reading and last_recorded fields updated in measurment with id '+ measurement.id);
        return res.status(200).send(true);
    })
    .catch(function(e){
        logger.error(e);
        if(e instanceof Errors.BadRequestError)
        return res.status(400).json(e.message);
        else if(e instanceof Errors.ValidationError)
        return res.status(422).json(e.message);
        else
        return res.status(500).json(e);
    });
};
