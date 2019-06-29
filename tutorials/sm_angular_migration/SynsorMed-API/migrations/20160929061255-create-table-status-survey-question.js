'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.createTable('status_survey_question', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          org_id: {
            type: Sequelize.INTEGER
          },
          text: {
            type: Sequelize.STRING
          },
          choices: {
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
     return done();
  }
};
