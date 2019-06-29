'use strict';

module.exports = {
    up: function(migration, DataTypes, done) {
        migration.addColumn('measurement_monitor_map', 'repeat_within_seconds', {
            type: DataTypes.INTEGER
        })
        .then(function(){
            return migration.addColumn('measurement_monitor_map', 'next_reading', {
                type: DataTypes.DATE
            });
        })
        .then(function(){
            done();
        })
        .catch(done);
    },

    down: function(migration, DataTypes, done) {
        migration.removeColumn('measurement_monitor_map', 'repeat_within_seconds');
        migration.removeColumn('measurement_monitor_map', 'next_reading');
        done();
    }
};
