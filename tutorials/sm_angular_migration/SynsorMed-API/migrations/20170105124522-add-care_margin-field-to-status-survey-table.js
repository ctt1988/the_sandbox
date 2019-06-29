'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn('status_survey', 'care_margin', {
        type: Sequelize.INTEGER
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
