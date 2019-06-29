'use strict';

module.exports = {
    up: function (migration, DataTypes, done) {
        migration.createTable('oauth_monitor_token', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            monitor_id : {
                type : DataTypes.INTEGER
            },
            service_name : {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            oauth_data : {
                type: DataTypes.TEXT,
                allowNull: true
            },
            created_at: {
                type: DataTypes.DATE
            },
            updated_at: {
                type: DataTypes.DATE
            }
        })
        .then(function(){
            return migration.addColumn('measurement_monitor_map', 'oauth_id', {
                type: DataTypes.INTEGER
            });
        })
        .then(function(){
            done();
        })
        .catch(done);
    },

    down: function (migration, DataTypes, done) {
        migration.dropTable('oauth_monitor_token');
        done();
    }
};
