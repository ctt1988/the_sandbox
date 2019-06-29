'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.createTable('organization_leaderboard', {
          id: {
              type: Sequelize.INTEGER,
              autoIncrement: true,
              primaryKey: true
          },
          org_id: {
              type: Sequelize.INTEGER
          },
          isLeaderboardActive: {
              type: Sequelize.BOOLEAN,
              defaultValue: 0
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
