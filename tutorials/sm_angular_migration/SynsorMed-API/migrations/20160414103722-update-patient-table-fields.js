'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
      queryInterface.changeColumn('patient', 'dob', {
          type: Sequelize.DATE,
          allowNull:true
      })
      .then(function(){
          return queryInterface.addColumn('patient', 'city', {
            type: Sequelize.STRING
          });
      })
      .then(function(){
          return queryInterface.addColumn('patient', 'state', {
            type: Sequelize.STRING
          });
      })
      .then(function(){
          return queryInterface.addColumn('patient', 'zip', {
            type: Sequelize.STRING
          });
      })
      .then(function(){
          return queryInterface.addColumn('patient', 'gender', {
            type: Sequelize.ENUM('male', 'female')
          });
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
