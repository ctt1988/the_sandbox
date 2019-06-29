"use strict";
var Q = require('q');

module.exports = {
    marshal: function (userModel) {
        var promises = [];

        return Q.spread([userModel.getOrganization(), userModel.getRole()], function (org, role) {
          return {
            id: userModel.id,
            name: userModel.first_name + (userModel.middle_name ? ' ' + userModel.middle_name + ' ' : ' ') + userModel.last_name,
            first_name: userModel.first_name,
            last_name: userModel.last_name,
            middle_name: userModel.middle_name,
            title: userModel.title,
            phone_mobile: userModel.phone_mobile,
            phone_work: userModel.phone_work,
            email: userModel.email,
            role: role.name,
            practiceId: userModel.org_id,
            lastActivity: userModel.lastActivity,
            org_id: userModel.org_id,
            network_id: userModel.network_id,
            deleted_at: userModel.deleted_at,
            is_reminder: userModel.is_reminder
          };
        });

    },
    unmarshal: function (rawData) {
        return rawData;
    }
};
