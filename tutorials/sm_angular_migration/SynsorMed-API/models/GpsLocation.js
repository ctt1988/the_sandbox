'use strict';

module.exports = function(sequelize, DataTypes){
    return sequelize.define('GpsLocation', {
        id : {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        object_id: {
            type: DataTypes.INTEGER
        },
        object_type: {
            type: DataTypes.TEXT
        },
        object_data: {
            type: DataTypes.TEXT
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    },
    {
        tableName: 'gps_location'
    });
};
