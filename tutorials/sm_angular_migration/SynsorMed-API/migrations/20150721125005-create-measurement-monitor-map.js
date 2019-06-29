'use strict';

module.exports = {
  up: function (migration, DataTypes, done) {
      migration.createTable('measurement_monitor_map', {
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
        last_recorded : {
          type: DataTypes.DATE
        },
        measurement_id : {
          type : DataTypes.INTEGER
        },
        monitor_id : {
          type : DataTypes.INTEGER
        },
        upperbound : {
          type : DataTypes.INTEGER,
          allowNull: false
        },
        lowerbound : {
          type : DataTypes.INTEGER,
          allowNull: false
        },
        service_name : {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        oauth_data : {
          type: DataTypes.TEXT,
          allowNull: true
        },
        latest_reading : {
          type : DataTypes.STRING,
          allowNull : true
        }
      })
      .then(function(){
          return migration.addIndex('measurement_monitor_map', ['measurement_id']);
      })
      .then(function(){
          return migration.addIndex('measurement_monitor_map', ['monitor_id']);
      })
      .then(function(){
          return  migration.addIndex('measurement_monitor_map', ['service_name']);
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (migration, DataTypes, done) {
     migration.dropIndex('measurement_monitor_map', ['measurement_id']);
     migration.dropIndex('measurement_monitor_map', ['monitor_id']);
     migration.dropIndex('measurement_monitor_map', ['service_name']);
     migration.dropTable('measurement_monitor_map');
     done();
  }
};
