'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('LeaderboardActivities', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        monitor_id: {
            type: DataTypes.INTEGER
        },
        measurement_monitor_map_id: {
            type: DataTypes.INTEGER
        },
        measurement_id: {
           type: DataTypes.INTEGER
        },
        points: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATE
        },
        end_date: {
            type: DataTypes.DATE
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'leaderboard_activities'
    });
};
