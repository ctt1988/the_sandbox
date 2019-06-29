'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("MeasurementService", {
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
    measurement_id: {
      type: DataTypes.INTEGER
    },
    service_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'measurement_service_map'
  });
};
