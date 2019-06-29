'use strict';

var router = require('express').Router();
var cors = require('cors');
var url = require('url');
var oauthTokenModel = require('models').OauthMonitorToken;
var MeasurementMonitorModel = require('models').MeasurementMonitor;
var servicelist = require('../../../components/servicemap/servicelist');
var auth = require('./auth');
var jwt = require('../drivers/base/jwt');
var Errors = require('errors');
var logger = require('logger');

var OauthTokenMapModel = require('models').OauthTokenMap;

router.get('/auth/:serviceId', function(req, res){

  var serviceId = req.params.serviceId;
  var urlParsed = url.parse(req.url, true);

  //if service is not hosted then return 404
  if(!servicelist.isServiceAvailable(serviceId)){
    return res.status(404).send('Service ' + serviceId + ' not present.');
  }

  logger.trace('User want to link monitor '+urlParsed.query.monitorId+ ' with service '+serviceId);
  var callbackUrl = servicelist.getCallbackUrlByServiceId(serviceId);

  //we have to register the service
  auth
    .beginOauth(serviceId, callbackUrl)
    .then(function(results){

      //model pk
      var oauth_map_key = OauthTokenMapModel.getPrimaryKey(results.oauth_token, serviceId);
      //save token
      OauthTokenMapModel
      .create({
          id: oauth_map_key,
          data: JSON.stringify({
            oauth_token_secret: results.oauth_token_secret,
            monitorId: urlParsed.query.monitorId,
            measurementMapId: (urlParsed.query.measurementMapId ? urlParsed.query.measurementMapId : null)
          })
        })
      .then(function(created){
            logger.trace('Created new entry in OauthTokenMap with id ' + created.id);

            //delete all last day records
            OauthTokenMapModel.destroy({where: ['DATE(updated_at) < CURRENT_DATE()']});

            return res.redirect(results.redirectURL);
        })
      .catch(function(e){
          logger.error(e);
          return res.status(500).json('Unable to create oauth session.');
      });

    })
    .catch(function(err){
      logger.error(err);
      return res.status(401).json(err);
    });

});


//call back handler for all apis , it will return oauth token in json object
// CORS is required here
router.get('/handle/:serviceId', cors(), function(req, res){

    var urlParsed = url.parse(req.url, true);
    var params = urlParsed.query;
    var serviceId = req.params.serviceId;

    var monitorId = null;
    var measurementMapId = null;

    //model pk
    var oauth_map_key = OauthTokenMapModel.getPrimaryKey(params.oauth_token, serviceId);
    OauthTokenMapModel
      .findById(oauth_map_key)
      .then(function(OauthMap){

        var oauthData = JSON.parse(OauthMap.data);

        //get the token secret from database
        var token_secret = oauthData.oauth_token_secret;

        //get other request data
        monitorId = oauthData.monitorId;
        measurementMapId = oauthData.measurementMapId;

        // now get the access token
        return auth.getAccessToken(serviceId, params.oauth_token, params.oauth_verifier, token_secret);
      })
      .then(function(results){

          var response = {};
          response.success = true;
          response.data = jwt.encode(results);
          var data = {
              monitor_id: monitorId,
              service_name: serviceId
          };
          if(!data.monitor_id){
              return res.status(200).json(response);
          }
          return oauthTokenModel
              .findOrCreate({where: data})
              .spread(function(oauthRow){
                  return oauthRow.refreshToken(results);
              }).then(function(oauthRow){
                  return MeasurementMonitorModel
                  .findById(measurementMapId)
                  .then(function(measure){
                      if(!measure){
                          throw new Errors.BadRequestError('No measurement monitor link found for ' + measurementMapId);
                      }
                      measure.oauth_id = oauthRow.id;
                      return measure.save()
                      .then(function(){
                          logger.trace('Updated oauth_id field in measurementMap with id ' + measure.id);
                          logger.trace('Monitor '+monitorId+' linked with service '+serviceId);
                          //send window close event
                          res.writeHeader(200, {'Content-Type': 'text/html'});
                          //send back message success
                          res.write('<script>window.close();</script>');
                          return res.end();
                      });
                  });
              });
      })
      .catch(function(err){
          logger.error(err);
          return res.status(500).json(err);
      });

});

module.exports = router;
