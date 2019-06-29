'use strict';

module.exports = {
    up: function (queryInterface, Sequelize, done) {
        queryInterface.createTable('leaderboard_activities', {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            monitor_id: {
                type: Sequelize.INTEGER
            },
            measurement_monitor_map_id: {
                type: Sequelize.INTEGER
            },
            measurement_id: {
               type: Sequelize.INTEGER
            },
            points: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            start_date: {
                type: Sequelize.DATE
            },
            end_date: {
                type: Sequelize.DATE
            },
            created_at: {
                type: Sequelize.DATE
            },
            updated_at: {
                type: Sequelize.DATE
            }
        })
        .then(function(){
            return done();
        })
        .catch(done);
    },

    down: function (queryInterface, Sequelize, done) {
        return done();
    }
};
