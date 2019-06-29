'use strict';

var _ = require('lodash');
var Errors = require('errors');
var logger = require('logger');
var models = require('models');
var config = require('config');
var email = require('../../emails');
var router = require('express').Router();
var saveDeviceInfo = require('./savedeviceinfo');
var jwt = require('../service/drivers/base/jwt');
var CSRFMiddleware = require('../../components/csrf');
var csrf = new CSRFMiddleware();
var quickblox = require('../../components/quick-blox');
var EncounterMarshaller = require('../../dto/encounter');

/**
* Route which can handle encounter codes
*/

router.post('/', function (req, res) {
  console.log('req**************************', req.origin)
  console.log('origin***********************', req.get('origin'))

  var code = null;
  if(req.body.code){
    code = req.body.code.toUpperCase();
  }else{
    return res.status(status).send("No Code");
  }
    var service = req.body.service || null;
    var oauthData = req.body.data || null;
    var encounterData = null;

    models.Encounter.find({
        where: {
            patient_code: {
                $like: code
            }
        },
        include: [models.User]
    })
    .then(function (encounter){
        if(!encounter){  //if there is no encounter
            logger.debug('No encounter found with code ' + code);
            throw new Errors.SecurityError('No encounter found with code ' + code);
        }

        encounterData = encounter;

        if( (service && oauthData) || (service === null && oauthData === null)){
            oauthData = jwt.decode(oauthData); //decode the data if its encoded
            logger.trace('Updating encounter with id ' + encounter.id);
            encounter.updateAttributes({  //add the oauth token data to for provider
                service_name: service,
                oauth_data: _.isEmpty(oauthData) ? null : JSON.stringify(oauthData)
            });
        }
        encounter.resetEncounterCallIndicator(); //update the encounter call ready to null , if no call has placed yet.
        return quickblox.createUser(encounterData.patient_code); // create qb user

    })
    .then(function(qbUser){
        csrf.attachToSession(req.session, function (token) {
            req.session.encounterCode = code;
            req.session.save(function () {
                EncounterMarshaller.marshal(encounterData).then(function (encounterJson) {
                    logger.info('Logging in Encounter ' + code);
                    encounterJson.csrfToken = token;
                    res.header('Access-Control-Expose-Headers', 'X-Session-Token');
                    res.json(encounterJson);
                });
            });
        });

        if(req.body.device){
            return saveDeviceInfo('encounter', encounterData.id, req.body.device)
            .then(function(){
                var active_org_ids = config.get('push_notifications.active_org_ids') || [];
                //if(encounterData && active_org_ids.indexOf(encounterData.User.org_id) != -1){ // if acitve org monitor
                if(qbUser.id){
                   return require('./subscribeForPushNotification')(code, req.body.device, qbUser)
                   .then(function(){
                       return models.User.isOnline(encounterData.provider_id);
                   });
                }
                else{
                   console.log('There was an issue with getting the quickblox user created or subscribed');
                   return models.User.isOnline(encounterData.provider_id);
                }
            });
        }

        return models.User.isOnline(encounterData.provider_id);
    })
    .then(function(isProviderOnline){
        logger.debug('provider Status is '+isProviderOnline);
        if(!isProviderOnline && encounterData.provider_id){
            return models.User.findOne({
                where: { id: encounterData.provider_id }
            })
            .then(function(providerData){
                return email.sendProviderNotification(providerData.email, encounterData.patient_code);
            });
        }
    })
    .catch(function(err){
        console.log("*** the error during authentication is: " + JSON.stringify(err));
        var status = err.name == 'SecurityError' ? 401 : 500;
        return res.status(status).send(err);
    });
});

module.exports = router;
