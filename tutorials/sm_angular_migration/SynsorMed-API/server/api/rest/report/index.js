var router = require('express').Router();
var Errors = require('errors');

var sessionCheck= function(req, res, next) {
    if(req.session.userId){
        next();
    } else {
        throw new Errors.SecurityError('Access Denied - Not Authenticated ');
    }
};

router.use('/compliance', sessionCheck, require('./compliance'));
router.use('/summary', sessionCheck, require('./summary'));

module.exports = router;
