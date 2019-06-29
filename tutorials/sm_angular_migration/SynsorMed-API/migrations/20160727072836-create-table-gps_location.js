'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.createTable('gps_location', {
          id : {
              type: Sequelize.INTEGER,
              autoIncrement: true,
              primaryKey: true
          },
          object_id: {
              type: Sequelize.INTEGER
          },
          object_type: {
              type: Sequelize.TEXT
          },
          object_data: {
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