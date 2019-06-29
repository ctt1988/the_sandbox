'use strict';

module.exports = {
    up: function (queryInterface, Sequelize, done) {
        queryInterface.addColumn('measurement_monitor_map', 'diseases_id', {
            type: Sequelize.INTEGER
        })
        .then(function(){
            done();
        })
        .catch(done);
    },
    down: function (queryInterface, Sequelize, done) {
        done();
    }
};
