'use strict';

var Q = require('q');
var monitorRules = require('../server/rules/monitor');
var activeMeasurements = require('config').get('leaderboard.measurement_ids');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('MeasurementMonitor', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serial_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        },
        last_recorded: {
            type: DataTypes.DATE
        },
        measurement_id: {
            type: DataTypes.INTEGER
        },
        monitor_id: {
            type: DataTypes.INTEGER
        },
        oauth_id: {
            type: DataTypes.INTEGER
        },
        upperbound: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        lowerbound: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status_survey_id : {
            type: DataTypes.INTEGER
        },
        //kept only for BC
        service_name: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        //kept only for BC
        oauth_data: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        sensitivity: {
            type: DataTypes.INTEGER,
            defaultValue: 2,
            allowNull: false
        },
        repeat_within_seconds: {
            type: DataTypes.INTEGER
        },
        prev_reading: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        latest_reading: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        infraction: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          allowNull: false
        },
        diseases_id: {
            type: DataTypes.INTEGER
        },
        is_enrolled: {
            type: DataTypes.BOOLEAN,
            defaultValue: 0
        },
        deleted_at: {
            type: DataTypes.DATE
        },
        is_education:{
          type: DataTypes.BOOLEAN,
          defaultValue: 0
        }
    }, {
        deletedAt: 'deleted_at',
        paranoid: true,
        tableName: 'measurement_monitor_map',
        instanceMethods: {
            /**
            * Has gone out of bounds
            */
            isOutofBounds: function(){
                return monitorRules.isOutOfBound(this.upperbound, this.lowerbound, this.latest_reading);
            },
            /**
            * Is Enrolled for leaderboard
            */
            isEnrolled: function(){
                return (activeMeasurements.indexOf(this.measurement_id) != -1) && !!this.is_enrolled;
            },
            /**
            * Is alarmed
            */
            isAlarMed: function(){
                var latestReading = null;
                var prevReading = null;
                var isMissed = this.isMissed();
                if(isMissed) return false;
                try{
                    latestReading = JSON.parse(this.latest_reading);
                    prevReading = JSON.parse(this.prev_reading);
                }
                catch(e){
                   return false;
                }
                var newAlarms = monitorRules.isAlarMed(latestReading, prevReading);
                return !!newAlarms.length;
            },
            /**
            * Is missed
            */
            isMissed: function(){
                return monitorRules.isMissed(this.created_at, this.last_recorded, this.repeat_within_seconds, this.sensitivity, false);
            },
            /**
            * Missed Severity
            */
            missedSeverity: function(){
                return monitorRules.isMissed(this.created_at, this.last_recorded, this.repeat_within_seconds, this.sensitivity, true);
            },
            /**
            * API for getting oauth_data
            *
            * @param String OauthMonitorToken     , contains data from OauthMonitorToken
            *
            **/
            getAuthData: function(OauthMonitorToken){
              var deffered = Q.defer();

              if(this.service_name && this.oauth_data && !this.oauth_id)
              {
                deffered.resolve({
                  service_name: this.service_name,
                  oauth_data: this.oauth_data,
                  updated_at: this.updated_at
                });
              }
              else {
                if(OauthMonitorToken){
                  deffered.resolve({
                    service_name: OauthMonitorToken.service_name,
                    oauth_data: OauthMonitorToken.oauth_data,
                    updated_at: OauthMonitorToken.updated_at
                  });
                } else {
                  sequelize.model('OauthMonitorToken')
                  .findOne({ where: {
                      id: this.oauth_id
                    }
                  })
                  .then(function(data){
                    if(!data)
                    {
                      deffered.resolve(null);
                    }
                    else{
                      deffered.resolve({
                        service_name: data.service_name,
                        oauth_data: data.oauth_data,
                        updated_at: data.updated_at
                      });
                    }
                  })
                  .catch(function(err){
                    deffered.reject(err);
                  });
                }
              }

              return deffered.promise;
            }
          }
        });
    };
