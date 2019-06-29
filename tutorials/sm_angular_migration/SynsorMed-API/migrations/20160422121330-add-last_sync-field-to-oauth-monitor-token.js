'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.addColumn('oauth_monitor_token', 'last_sync', {
                type: Sequelize.DATE,
                allowNull: true
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
