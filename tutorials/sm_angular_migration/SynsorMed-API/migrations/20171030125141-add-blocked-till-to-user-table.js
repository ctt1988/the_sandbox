'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.addColumn('user', 'blocked_till', {
          type: Sequelize.TEXT
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
