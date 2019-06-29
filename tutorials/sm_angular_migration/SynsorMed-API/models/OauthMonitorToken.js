'use strict';

var logger = require('logger');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OauthMonitorToken', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        monitor_id: {
            type: DataTypes.INTEGER
        },
        service_name: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        oauth_data: {
            type: DataTypes.TEXT('medium'),
            allowNull: true
        },
        service_user_id: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        last_sync: {
            type: DataTypes.DATE,
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
        tableName: 'oauth_monitor_token',
        classMethods: {
            getPrimaryKey: function(token, service){ return (token + '-' + service); }
        },
        instanceMethods: {
            refreshToken: function(resp){
                resp.user_id = resp.user_id || this.service_user_id; //refreshing tokens too fast, fitbit omits user_id ...:0
                var userId = resp.user_id // users for whoes token will be updated
                , serviceName =  this.service_name
                , self = this
                , updatedInstance = null;
                return this.updateAttributes({ //update the current instance
                    oauth_data: JSON.stringify(resp),
                    service_user_id: userId
                })
                .then(function(newInstance) {
                    logger.trace('Updating oauth_monitor_token with id '+ self.id);
                    updatedInstance = newInstance;
                    return self.Model.update({     //update all other instances with same service_user_id and service_name
                        oauth_data: JSON.stringify(resp),
                        service_user_id: userId // this user is API's userId e.g Fitbit's 3Uv45
                    }, {
                        where: {
                            service_user_id: userId,
                            service_name: serviceName
                        }
                    });
                })
                .spread(function(affectedCount){
                    logger.debug('Updated ' +affectedCount+ ' related tokens');
                    return updatedInstance; // return instance
                });
            },
            setLastSyncDate : function(lastSyncDate){
                var that = this;
                return new sequelize.Promise(function(resolve, reject){
                    if(!lastSyncDate) return resolve(false);
                    return that.updateAttributes({
                        last_sync: lastSyncDate
                    })
                    .then(resolve)
                    .catch(reject);
                });
            }

        }
    });
};
