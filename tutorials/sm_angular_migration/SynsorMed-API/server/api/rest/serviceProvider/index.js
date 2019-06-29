'use strict';

var router = require('express').Router();
var Errors = require('errors');

var sessionCheck = function(req, res, next) {
  if(req.session.userId || req.session.monitorCode) {
    next();
  } else {
    throw new Errors.SecurityError('Access to monitor denied - not authenticated ');
  }
};

router.use('/synsormed', sessionCheck, require('./synsormed'));

module.exports = router;
