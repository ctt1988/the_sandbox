'use strict';

module.exports = {
    up: function(migration, DataTypes, done) {
        migration.addColumn('measurement_monitor_map', 'process_time', {
            type: DataTypes.DATE,
            allowNull: true
        })
        .then(function(){
            done();
        })
        .catch(done);
    },

    down: function(migration, DataTypes, done) {
        migration.removeColumn('measurement_monitor_map', 'process_time');
        done();
    }
};