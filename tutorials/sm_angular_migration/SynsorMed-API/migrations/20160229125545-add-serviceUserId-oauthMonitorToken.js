'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn('oauth_monitor_token', 'service_user_id', {
        type: Sequelize.STRING(50),
        allowNull: true
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.removeColumn('oauth_monitor_token', 'service_user_id');
    done();
  }
};
