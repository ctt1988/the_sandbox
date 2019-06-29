'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('measurement_service_map', {
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
      measurement_id : {
        type : DataTypes.INTEGER
      },
      service_id : {
        type : DataTypes.INTEGER
      }
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.dropTable('measurement_service_map');
    done();
  }
};
