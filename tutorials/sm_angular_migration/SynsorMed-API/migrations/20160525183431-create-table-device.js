'use strict';

module.exports = {
    up: function (queryInterface, Sequelize, done) {
        queryInterface.createTable('device', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            object_type : {
                type : Sequelize.STRING,
                allowNull : false
            },
            object_id: {
                type: Sequelize.INTEGER,
                allowNull : false
            },
            info: {
                type: Sequelize.TEXT,
                allowNull: true
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
