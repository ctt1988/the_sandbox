'use strict';

module.exports = {
    up: function (queryInterface, Sequelize, done) {
        queryInterface.addColumn('status_survey_question', 'status_survey_id', {
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
