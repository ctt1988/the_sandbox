'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.changeColumn('oauth_monitor_token', 'oauth_data', {
          type: Sequelize.TEXT('medium'),
          allowNull: true
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
