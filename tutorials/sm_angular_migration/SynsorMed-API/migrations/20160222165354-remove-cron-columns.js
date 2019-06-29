'use strict';

module.exports = {
  up: function (migration, DataTypes, done) {
      migration.addColumn('measurement_monitor_map', 'infraction', {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false
      })
      .then(function(){
          return migration.removeColumn('measurement_monitor_map', 'next_reading');
      })
      .then(function(){
          return migration.removeColumn('measurement_monitor_map', 'process_time');
      })
      .then(function(){
          done();
      })
      .catch(done);
  },

  down: function (migration, DataTypes, done) {
    done();
  }
};
