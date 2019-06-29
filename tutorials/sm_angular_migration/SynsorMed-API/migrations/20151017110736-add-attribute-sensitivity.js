'use strict';

module.exports = {
    up: function(migration, DataTypes, done) {
        migration.addColumn('measurement_monitor_map', 'sensitivity', {
            type: DataTypes.INTEGER,
            defaultValue: 2,
            allowNull: false
        })
        .then(function(){
            done();
        })
        .catch(done);
    },

    down: function(migration, DataTypes, done) {
        migration.removeColumn('measurement_monitor_map', 'sensitivity');
        done();
    }
};
