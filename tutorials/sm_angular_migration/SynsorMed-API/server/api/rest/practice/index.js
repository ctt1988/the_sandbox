'use strict';

var models = require('models');
var config = require('config');
var logger = require('logger');
var router = require('express').Router();
var PracticeMarshaller = require('../../../dto/practice');
var practiceHandlers = require('express').Router({mergeParams: true});

practiceHandlers.get('/', function (req, res) {
    PracticeMarshaller.marshal(req.organization).then(function (data) {
        res.json(data);
    });
});

practiceHandlers.put('/', function (req, res) {
    var practiceFromJSON = PracticeMarshaller.unmarshal(req.body);
    models.sequelize.Promise.all([
        models.OrganizationPreference.findOrCreate({
            where: {
                org_id: req.organization.id, key: 'defaultFee'
            }
        })
        .spread(function (pref) {
            logger.trace('Updating organization prefrence with id '+ pref.id + ' and key defaultFee');
            return pref.update({ value: practiceFromJSON.defaultFee });
        }),

        req.organization.update({
            name: practiceFromJSON.name
        }),
        models.OrganizationPreference.findOrCreate({
            where: {
                org_id: req.organization.id, key: 'orgEmails'
            }
        })
        .spread(function(pref){
            logger.trace('Updating organization prefrence with id '+ pref.id + ' and key orgEmails');
            return pref.update({ value: practiceFromJSON.orgEmails });
        }),
        models.OrganizationLeaderboard.findOrCreate({
            where: { org_id: req.organization.id }
        })
        .spread(function(leaderBoard){
            logger.trace('Updating organization leaderBoard with id '+ leaderBoard.id + ' with active key = ' + practiceFromJSON.isLeaderboardActive);
            return leaderBoard.update({ isLeaderboardActive: practiceFromJSON.isLeaderboardActive });
        })
    ])
    .then(function () {
        return req.organization.getSurveyQuestions()
        .then(function (questions){
            var actions = [];
            for (var i = 0, l = questions.length; i < l; i++) {
                var question = questions[i];
                var existingQuestion = req.body.surveyQuestions.filter(function (q) {
                    return q.id == question.id;
                });
                existingQuestion = (existingQuestion && existingQuestion.length) ? existingQuestion[0] : false;
                if(existingQuestion) {
                    actions.push(question.update(existingQuestion));
                } else {
                    actions.push(question.destroy());
                }
            }

            for(i = 0, l = req.body.surveyQuestions.length; i < l; i++) {
                if(!req.body.surveyQuestions[i].id) {
                    req.body.surveyQuestions[i].org_id = req.organization.id;
                    actions.push(models.SurveyQuestion.create(req.body.surveyQuestions[i]));
                }
            }

            return models.sequelize.Promise.all(actions).spread(function () {
                logger.debug('Done doing updates');
            });
        });
    }).then(function () {
        PracticeMarshaller.marshal(req.organization).then(function (data) {
            res.json(data);
        });
    })
    .catch(function (err) {
        return res.status(500).send(err);
    });
});

practiceHandlers.put('/active', function (req, res) {
    models.User.findById(req.session.userId).then(function (user) {
        if(user.role_id != config.seeds.roles.SuperAdmin) return res.status(401).end(); //super admin check
        req.organization.is_active = !!req.body.active;
        req.organization.save()
        .then(function(){
            logger.trace('Set is_active field of organization '+req.organization.id+' to '+ req.organization.is_active);
            return res.send(!!req.body.active);
        })
        .catch(function(){
            return res.status(404).send(false);
        });
    });
});

router.use('/:practiceId', function (req, res, next) {
    models.User.findById(req.session.userId)
    .then(function(user){
        if(!user) return res.status(401).end();
        if(user.org_id != req.params.practiceId && user.role_id != config.seeds.roles.SuperAdmin){
            return res.status(401).end();
        }
        return models.Organization.findById(req.params.practiceId).then(function (organization) {
            if (!organization) return res.status(404).end();
            req.organization = organization;
            next();
        });
    })
    .catch(function (err) {
        return res.status(500).send(err);
    });
}, practiceHandlers);

module.exports = router;
