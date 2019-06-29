var router = require('express').Router();
var UserModel = require('models').User;
var Errors = require('errors');
var logger = require('logger');
var isOnline = require('../../../rules/isOnline');

router.use('/', function (req, res, next) {
    if(!req.session.userId && !req.session.encounterCode) {
        throw new Errors.SecurityError('Login required to check statuses');
    } else {
        next();
    }
});

var providerStatusRouter = require('express').Router();

providerStatusRouter.get('/:providerId', function (req, res) {
    UserModel.findById(req.params.providerId)
    .then(function (user) {
        var userOnline = isOnline(user.last_activity);
        logger.trace('User '+user.id+' is online');
        res.json({online: userOnline});
    });
});

router.use('/provider', providerStatusRouter);

module.exports = router;
