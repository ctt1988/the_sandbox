'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('PatientUser', {
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
  },
  {
    tableName: 'patient_user_map'
  });
};
