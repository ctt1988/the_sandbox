'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn('service', 'meta_data', {
        type: Sequelize.TEXT
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
