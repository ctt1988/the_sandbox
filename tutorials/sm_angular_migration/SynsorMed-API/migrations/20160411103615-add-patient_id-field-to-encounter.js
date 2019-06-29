'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.addColumn('encounter', 'patient_id',
      {
          type: Sequelize.INTEGER
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (queryInterface) {
     return queryInterface.removeColumn('encounter', 'patient_id');
  }
};
