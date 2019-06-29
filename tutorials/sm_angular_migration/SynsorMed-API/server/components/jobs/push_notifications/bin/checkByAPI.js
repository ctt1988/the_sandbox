'use strict';

var bin = require('./index');
var config = require('config');
var logger = require('logger');
var adminRoleId = config.get('seeds.roles.Admin');
var push = require('../../../quick-blox/push-notifications');

module.exports = function(organization){
    return organization.getUsers({
        where: {
            role_id: adminRoleId
        }
    })
    .spread(function(admin){
        var username =  admin.email;
        var orgTag = bin.getTags(organization.id);
        var message = bin.message();
        return push.sendPushNotificationByTags(orgTag, message, username);
    })
    .catch(function(error){
        console.log(error);
        logger.error(error);
    });
};
