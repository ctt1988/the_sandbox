'use strict';

module.exports = function(sequelize, DataTypes){
    return sequelize.define('Event', {
        id: {
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
        type: {
            type: DataTypes.TEXT
        },
        event_data: {
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
        tableName: 'event',
        classMethods: {
            createEvent: function(objectId, objectType, type, eventData){
                return this.create({
                    object_id: objectId,
                    object_type: objectType,
                    type: type,
                    event_data: JSON.stringify(eventData)
                });
            },
            createDocumentEvent: function(objectId, eventData){
                 return this.createEvent(objectId, 'monitor', 'document_read', eventData);
            },
            createDataRecieveEvent: function(objectId, eventData){
                 return this.createEvent(objectId, 'measurement', 'data_recieved', eventData);
            },
            createDataUploadEvent: function(objectId, eventData){
                 return this.createEvent(objectId, 'monitor', 'data_upload', eventData);
            }
        }
    });
};
