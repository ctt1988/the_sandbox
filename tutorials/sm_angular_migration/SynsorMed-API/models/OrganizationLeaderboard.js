'use strict';

var config = require('config');
var moment = require('moment');
var units = require('../server/api/service/drivers/base/units');
var resetPeriod = config.get('leaderboard.reset_period') || 7;

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrganizationLeaderboard', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        org_id: {
            type: DataTypes.INTEGER
        },
        isLeaderboardActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'organization_leaderboard',
        classMethods: {
            getCurrentSessionStartDate: function(initialDate){
                var today = moment().startOf('day');
                var startDate = moment(initialDate).startOf('day');
                var diff = units.getDateDifferenceInDays(today, startDate);
                var dateDiff = diff > resetPeriod ? (diff % resetPeriod == 0 ? resetPeriod : diff % resetPeriod) : diff;
                var date = today.subtract(dateDiff, 'days').startOf('day');
                var weekday = date.weekday();
                if(weekday != 0) date = date.subtract(weekday, 'days').startOf('day'); // if startdate is not sunday
                return date.format();
            },
            getCurrentSessionEndDate: function(startDate){
                return  moment(startDate).startOf('day').add(resetPeriod, 'days').endOf('day').format();
            }
        }
    });
};
