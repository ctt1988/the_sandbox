'use strict';

module.exports = {
    up: function (queryInterface, Sequelize, done) {
        queryInterface.createTable('document', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            diseases_id: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            org_id: {
                type: Sequelize.INTEGER
            },
            day: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            files:{
                type: Sequelize.TEXT
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
