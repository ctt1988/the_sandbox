'use strict';

var _ = require('lodash');
var practiceDto = require('../../../../dto/practice');
var OrganizationModel = require('models').Organization;

module.exports = function(User, MonitorEmails, allEmails){
    var emails = []; //indicate no email was sent

    return OrganizationModel.findById(User.org_id)
    .then(function(org){
        return practiceDto.marshal(org);
    })
    .then(function(results){
        if(!_.isEmpty(results) && !_.isEmpty(results.orgEmails)){
            emails = results.orgEmails.split(',');
            if(allEmails) emails.push(User.email);
        }
        else {
            emails.push(User.email);
        }

        if(MonitorEmails){
            emails =  _.union(emails, MonitorEmails.split(','));
        }
        return emails;
    });
};
