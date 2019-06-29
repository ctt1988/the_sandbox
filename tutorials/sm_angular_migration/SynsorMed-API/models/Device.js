'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Device', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        object_type : {
            type : DataTypes.STRING,
            allowNull : false
        },
        object_id: {
            type: DataTypes.INTEGER,
            allowNull : false
        },
        info: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        }
    },
    {
        tableName: 'device',
        classMethods: {
            getMonitorData: function(monitorId){
                return this.findOne({
                    where: {
                        object_id: monitorId,
                        object_type: 'monitor'
                    }
                });
            },
            getEncounterData: function(encounterId){
                return this.findOne({
                        where:{
                            object_id: encounterId,
                            object_type: 'encounter'
                        }
                });
            }
        }
    });
};
