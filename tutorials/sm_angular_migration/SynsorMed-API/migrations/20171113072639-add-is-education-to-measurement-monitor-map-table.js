'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.addColumn('measurement_monitor_map', 'is_education', {
          type: Sequelize.BOOLEAN
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
