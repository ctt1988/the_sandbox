'use strict';

var _ = require('lodash');
var logger = require('logger');
var reader = require('./reader');
var driver = require('../../../service/driver');
var units = require('../../../service/drivers/base/units');
var measurementDto = require('../../../../dto/measurement');
var router = require('express').Router({mergeParams: true});

router.get('/', function(req, res){
    var measurementId = req.params.measurementId;
    console.log('>>>>>>>>>>>>>>>', measurementId);
    var monitor = req.monitorModel;
    // console.log(monitor);
    var measurementUnits, measurementMap;
    var days = req.query.days;
    var firstDate = req.query.firstDate;
    var secondDate = req.query.secondDate;
    var upperbound;
    console.log('-------------------here1---------------------');
    monitor.getMeasurementMaps(measurementId)
    .then(function(measurementMapData){
        measurementMap = measurementMapData[0];
        upperbound= measurementMapData[0].upperbound || null;
        measurementUnits = measurementDto.marshal(measurementMap.Measurement, upperbound);
        if(_.isEmpty(measurementMap)) return res.status(404).send('Monitor Measurement link not found');

        return measurementMap.getAuthData();
    })
    .then(function(allResults){
        var data = allResults;

        if(!data) return res.status(404).send('No service linked');
        var oauthData = JSON.parse(data.oauth_data);
        var service_name = data.service_name;
        if(!oauthData) return res.status(422).send('Unable to fetch any auth data from service');

        //model instance to update in OAuth2 case
        var callback = function(error, results){
            //logger.debug(results);
            res.setHeader('X-SynsorMed-Last-Sync-Time', results.lastSyncTime);
            res.header('Access-Control-Expose-Headers', 'X-SynsorMed-Last-Sync-Time');

            if(error){
                logger.error(error);
                return res.status(401).json(results);
            }

            if(_.isEmpty(results.data)){
                results.data = null;
                return res.status(409).send('Service has no readings submitted in the last 30 days');
            }

            var data = reader(measurementUnits, service_name, results, true);
            if(_.isEmpty(data)) return res.status(409).send('Service has no readings submitted in these days for current measurement');
            var dates = Object.keys(data);
            if(_.isEmpty(dates)) return res.status(422).send('Unable to fetch required data from service.');


            //sort the dates
            dates = dates.map(function(a){
                return { date: a, unix: units.getUnixFromFormattedDateTime(a) };
            });

            dates.sort(function(a, b){
                return a.unix < b.unix ? -1 : 1;
            });

            dates = dates.map(function(a){
                return a.date;
            });

            // console.log(data);
            var finalObj = require('./parser')(measurementUnits, false, dates, data, results, service_name);
            // console.log(finalObj);
            // console.log(finalObj.series[0]);
            return res.send(finalObj);

        };

        if(typeof oauthData == 'string') oauthData = JSON.parse(oauthData);
        var measurementName = measurementUnits.name.toLowerCase();
        oauthData.oauthModelInstance = measurementMap.oauth_id ? measurementMap.OauthMonitorToken : measurementMap;
        //oauthData.days = ( measurementName == 'steps' || measurementName == 'caloric intake') ? 30 : (measurementName == 'oxygen flow' || measurementName === 'status' ? days : 10);
        //For all measurement types, do not limit days artificially
        oauthData.days = days;
        oauthData.entries = measurementName == 'oxygen flow' ? 30 : false;
        oauthData.firstDate = firstDate ? firstDate : 0;
        oauthData.secondDate = secondDate ? secondDate : 0;
        oauthData.all = true;
        oauthData.updated_at = data.updated_at;
        oauthData.upperbound = upperbound || null;
        driver.getUserDetails(service_name, oauthData, measurementName) //fetch the user profile information
        .then(function(results){
            return callback(null, results);
        })
        .catch(function(err){
            logger.error(err);
            return callback(true, err);
        });
    })
    .catch(function(e){
        logger.error(e);
        return res.status(500).json(e);
    });
});

module.exports = router;
