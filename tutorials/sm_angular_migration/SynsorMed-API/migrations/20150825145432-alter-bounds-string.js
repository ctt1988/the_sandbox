'use strict';

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.changeColumn('measurement_monitor_map', 'upperbound', {
       type: DataTypes.STRING,
       allowNull: false
    })
    .then(function(){
        return  migration.changeColumn('measurement_monitor_map', 'lowerbound', {
            type: DataTypes.STRING,
            allowNull: false
         });
    })
    .then(function(){
        done();
    })
    .catch(done);
  },

  down: function(migration, DataTypes, done) {
    migration.changeColumn('measurement_monitor_map', 'upperbound', {
       type: DataTypes.INTEGER,
       allowNull: false
    });
    migration.changeColumn('measurement_monitor_map', 'lowerbound', {
      type: DataTypes.INTEGER,
      allowNull: false
    });
    done();
  }
};
