'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.createTable('status_survey', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          survey_name: {
            type: Sequelize.STRING
          },
          display_name: {
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
          return done();
      })
      .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
     return done();
  }
};
