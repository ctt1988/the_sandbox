var router = require('express').Router({mergeParams: true});
var models = require('models');
var EncounterModel = models.Encounter;
var RTCUserModel = models.RTCUser;
var UserModel = models.User;
var EncounterDTO = require('../../../dto/encounter');
var Q = require('q');
var config = require('config');
var logger = require('logger');

//in seconds
var lastActivityThreshold = 35;

router.get('/', function (req, resp) {

    var providerId = parseInt(req.params['providerId']);
    var queryDate = req.query.date;
    var todayStart = isNaN(new Date(queryDate)) ? new Date() : new Date(queryDate);
    var todayEnd = new Date(todayStart);
    todayEnd.setHours(todayStart.getHours() + 24);

    logger.debug('Worklist Range = ' + todayStart + ', ' + todayEnd);

    var where = { scheduled_start: { $between: [ todayStart, todayEnd ] } };
    var include = [];

    if((config.seeds.roles.Admin == req.current_user.role_id) && !providerId){
        var org_id = req.current_user.org_id;
        include.push({ model : UserModel, where: { org_id : org_id }});
        logger.trace('Getting all worklists for organization '+org_id);
    } else {
         where.provider_id = providerId;
         logger.trace('Getting all worklists for provider '+providerId);
    }

    if(req.query.waiting) {
      var lastActivityDateCutoff = new Date();
      lastActivityDateCutoff.setSeconds(lastActivityDateCutoff.getSeconds() - lastActivityThreshold);
      where.last_activity = {$gte: lastActivityDateCutoff};
      /*where.rtc_user_id = {$ne : null};
      include.push({
              model : RTCUserModel,
              where : {
                last_activity : {$gte: lastActivityDateCutoff}
              }
          }); */
    }

    var query = {
         where: where,
         include : include
    };

    return EncounterModel.findAll(query).then(function (results) {
        var marshal = [];
        for(var i = 0, l = results.length; i < l; i++) {
            var promise = EncounterDTO.marshal(results[i]);
            marshal.push(promise);
        }

        return Q.all(marshal).then(function (marshalled) {
            resp.json(marshalled);
        });
    }).catch(function (e) {
      logger.error(e);
      resp.status(500).end();
    });
});

module.exports = router;
