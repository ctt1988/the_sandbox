'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
       queryInterface.addColumn('measurement_monitor_map', 'serial_number', {
          type: Sequelize.STRING,
          allowNull: true
       })
       .then(function(){
           done();
       })
       .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
      queryInterface.removeColumn('measurement_monitor_map', 'serial_number');
      done();
  }
};
