'use strict';

module.exports = {
    up: function (queryInterface, Sequelize, done) {
        queryInterface.addColumn('measurement_monitor_map', 'status_survey_id', {
            type: Sequelize.INTEGER
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
