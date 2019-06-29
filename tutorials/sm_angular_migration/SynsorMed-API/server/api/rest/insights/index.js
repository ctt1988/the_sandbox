var router = require('express').Router();
var Errors = require('errors');

var sessionCheck= function(req, res, next) {
    if(req.session.userId){
        next();
    } else {
        throw new Errors.SecurityError('Access Denied - Not Authenticated ');
    }
};

router.use('/provider', sessionCheck, require('./provider'));

router.use('/practice', sessionCheck, require('./practice'));

router.use('/series', sessionCheck, require('./series'));

router.use('/admin', sessionCheck, require('./admin'));

module.exports = router;
