'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.addColumn('monitor', 'note_duration', {
          type: Sequelize.INTEGER
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