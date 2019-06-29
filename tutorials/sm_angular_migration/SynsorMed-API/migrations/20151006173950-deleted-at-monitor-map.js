'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('measurement_monitor_map', 'deleted_at', {
      type: DataTypes.DATE,
      allowNull: true
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.removeColumn('measurement_monitor_map', 'deleted_at');
    done();
  }
};
