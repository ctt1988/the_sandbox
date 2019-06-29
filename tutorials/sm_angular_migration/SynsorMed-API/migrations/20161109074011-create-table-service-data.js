'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.createTable('service_data', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          service_name: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          monitor_id: {
            type: Sequelize.INTEGER
          },
          service_data: {
            type: Sequelize.TEXT
          },
          deleted_at: {
            type: Sequelize.DATE
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
