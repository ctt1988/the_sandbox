'use strict';

var models = require('models');

module.exports = function(orgId){
    var tags = [];
    tags.push(models.Monitor.getOrganizationTag(orgId));
    return tags;
};
