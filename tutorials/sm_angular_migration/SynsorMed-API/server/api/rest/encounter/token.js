var router = require('express').Router();
var RTCUserModel = require('models').RTCUser;
var Errors = require('errors');
var WeemoAuth = require('server/components/weemo/weemo.auth');
var logger = require('logger');

router.get('/', function (req, res) {
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
        user.last_activity = new Date();
        return user.save()
        .then(function(){
            if(!user) {
                throw new Errors.HTTPNotFoundError('Could not find open token');
            }

            if(!req.session.encounterCode) {
                return req.encounterModel.getRTCUser().then(function (user) {
                    if(user) {
                        res.send(user.name);
                    } else {
                        res.status(404).end();
                    }
                });
            } else {
                req.session.rtccode = user.name;
                req.session.rtcid = user.id;
                return WeemoAuth.auth(user.name, user.domain, user.profile).then(function (token) {
                    req.session.rtctoken = token;
                });
            }
        });
    }).then(function () {
        if(!req.session.encounterCode) { return; }

        return req.encounterModel.update({
            rtc_user_id: req.session.rtcid
        }).then(function (encounter) {
            logger.trace('Updated encounter with id '+encounter.id);
            res.send(req.session.rtctoken);
        });
    });
});

router.delete('/', function (req, res) {
    req.session.rtccode = null;
    return req.encounterModel.update({
        rtc_user_id: null
    }).then(function (encounter) {
        logger.trace('Set rtc_user_id = null in encounter '+encounter.id);
        res.status(204).end();
    });
});

module.exports = router;
