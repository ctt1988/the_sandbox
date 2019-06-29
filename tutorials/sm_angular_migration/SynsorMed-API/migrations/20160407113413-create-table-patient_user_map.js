'use strict';

module.exports = {
  up: function (queryInterface, DataTypes, done) {
      queryInterface.createTable('patient_user_map', {
        id: {
           type: DataTypes.INTEGER,
           primaryKey: true,
           autoIncrement: true
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
          type: DataTypes.DATE
        },
        patient_id : {
          type : DataTypes.INTEGER
        },
        provider_id : {
          type : DataTypes.INTEGER
        }
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
      queryInterface.dropTable('patient_user_map');
      done();
  }
};
