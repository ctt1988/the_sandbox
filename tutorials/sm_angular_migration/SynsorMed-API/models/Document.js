'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Document', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        diseases_id:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
        org_id: {
            type: DataTypes.INTEGER
        },
        day: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        files:{
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
        tableName: 'document'
    });
};
