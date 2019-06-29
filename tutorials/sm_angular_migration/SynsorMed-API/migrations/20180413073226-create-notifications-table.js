'use strict';

module.exports = {
    up: function (queryInterface, Sequelize, done) {
        queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            monitor_id: {
                type: Sequelize.INTEGER
            },
            type : {
                type: Sequelize.STRING
            },
            created_at: {
                type: Sequelize.DATE
            },
            updated_at: {
                type: Sequelize.DATE
            }
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
