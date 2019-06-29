'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.addColumn('monitor', 'patient_id',
      {
          type: Sequelize.INTEGER
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (queryInterface) {
     return queryInterface.removeColumn('monitor', 'patient_id');
  }
};
