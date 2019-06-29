'use strict';

module.exports = {
  up: function (migration, DataTypes, done) {
    migration.createTable('monitor', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patient_code: {
        type: DataTypes.STRING
      },
      repeat_within_seconds : {
        type : DataTypes.INTEGER
      },
      description: {
        type: DataTypes.STRING(1000)
      },
      encounter_id : {
        type : DataTypes.INTEGER,
        allowNull : true
      },
      provider_id: {
        type: DataTypes.INTEGER,
        allowNull : false
      },
      appointment_meta : {
        type : DataTypes.TEXT
      },
      terms_accepted : {
        type : DataTypes.BOOLEAN
      },
      last_recorded : {
        type : DataTypes.DATE
      },
      next_reading : {
        type : DataTypes.DATE
      },
      created_at: {
        type: DataTypes.DATE
      },
      updated_at: {
        type: DataTypes.DATE
      }
    })
    .then(function(){
        return migration.addIndex('monitor', ['patient_code']); //Quicken patient code lookups
    })
    .then(function(){
        return migration.addIndex('monitor', ['provider_id']); //Quicken lookups of monitor for a provider
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function (migration, DataTypes, done) {
     migration.dropIndex('monitor', ['patient_code']);
     migration.dropIndex('monitor', ['provider_id']);
     migration.dropTable('monitor');
     done();
  }
};
