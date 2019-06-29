'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
        queryInterface.addColumn('measurement_monitor_map', 'is_enrolled', {
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        })
        .then(function(){
            done();
        })
        .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
      done();
  }
};
