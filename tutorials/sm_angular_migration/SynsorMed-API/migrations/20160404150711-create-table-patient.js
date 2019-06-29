'use strict';

module.exports = {
  up: function (queryInterface, DataTypes, done) {
      queryInterface.createTable('patient', {
        id: {
           type: DataTypes.INTEGER,
           primaryKey: true,
           autoIncrement: true
        },
        first_name : {
          type: DataTypes.STRING
        },
        last_name: {
          type: DataTypes.STRING
        },
        address: {
          type: DataTypes.STRING
        },
        dob: {
          type: DataTypes.DATE,
          allowNull:false
        },
        phone_mobile: {
            type: DataTypes.STRING
        },
        mobile_number:{
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        social_security_number: {
           type: DataTypes.STRING
        },
        medical_record_number: {
           type: DataTypes.STRING
        },
        created_at: {
          type: DataTypes.DATE
        },
        updated_at: {
          type: DataTypes.DATE
        }
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (queryInterface, Sequelize, done) {
      queryInterface.dropTable('patient');
      done();
  }
};
