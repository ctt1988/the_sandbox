'use strict';

var _ = require('lodash');
var config = require('./config');

exports.mailIsANumber = function(email){
    if(!email) return;
    var splittedEmail = email.split('@');
    var user = splittedEmail[0];
    var domain = '@' + splittedEmail[1];
    var response = false;
    _.forEach(config, function(record){
        if(domain == record.domain){
            response = true;
        }
    });
    response = response && !isNaN(user);
    return response;
};
