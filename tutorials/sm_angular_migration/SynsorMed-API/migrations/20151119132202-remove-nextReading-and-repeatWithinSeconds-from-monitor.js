'use strict';

module.exports = {
    up: function(migration, DataTypes, done) {
        migration.removeColumn('monitor', 'next_reading')
        .then(function(){
            return migration.removeColumn('monitor', 'repeat_within_seconds');
        })
        .then(function(){
            return migration.removeColumn('monitor', 'process_time');
        })
        .then(function(){
            done();
        })
        .catch(done);
    },

    down: function(migration, DataTypes, done) {
        migration.addColumn('monitor', 'next_reading', {
            type: DataTypes.DATE
        });
        migration.addColumn('monitor', 'repeat_within_seconds', {
            type: DataTypes.INTEGER
        });
        migration.addColumn('monitor', 'process_time', {
            type: DataTypes.DATE
        });
        done();
    }
};
