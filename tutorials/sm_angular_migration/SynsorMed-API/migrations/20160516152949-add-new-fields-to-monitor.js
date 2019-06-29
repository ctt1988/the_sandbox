'use strict';

module.exports = {
    up: function (queryInterface, Sequelize, done) {
        queryInterface.addColumn('monitor', 'start_date', {
            type: Sequelize.DATE
        })
        .then(function(){
            return queryInterface.addColumn('monitor', 'read_files', {
                type: Sequelize.TEXT
            });
        })
        .then(function(){
            return queryInterface.addColumn('monitor', 'unread_files', {
                type: Sequelize.TEXT
            });
        })
        .then(function(){
            return queryInterface.addColumn('monitor', 'last_reset_date', {
                type: Sequelize.TEXT
            });
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
