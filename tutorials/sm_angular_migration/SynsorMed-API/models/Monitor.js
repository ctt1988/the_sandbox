'use strict';

var moment = require('moment');
var isMissed = require('../server/rules/monitor').isMissed;
var logger = require('logger');
var _ = require('lodash');
var helpers = require('../server/api/rest/report/compliance/helpers');
var pushnotifications = require('../server/components/quick-blox/push-notifications');

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Monitor', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        patient_code: {
            type: DataTypes.STRING
        },
        patient_id: {
            type: DataTypes.INTEGER
        },
        description: {
            type: DataTypes.STRING(1000)
        },
        encounter_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        provider_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        appointment_meta: {
            type: DataTypes.TEXT
        },
        terms_accepted: {
            type: DataTypes.BOOLEAN
        },
        last_recorded: {
            type: DataTypes.DATE
        },
        auto_fetch: {
            type: DataTypes.BOOLEAN
        },
        created_at: {
            type: DataTypes.DATE
        },
        updated_at: {
            type: DataTypes.DATE
        },
        deleted_at: {
            type: DataTypes.DATE
        },
        notify: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        notify_requested: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        education_checked: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        reporting_emails:{
            type: DataTypes.STRING,
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATE
        },
        read_files: {
            type: DataTypes.TEXT
        },
        note: {
            type: DataTypes.TEXT
        },
        note_duration: {
          type: DataTypes.INTEGER
        },
        is_ccm: {
          type: DataTypes.BOOLEAN
        },
        unread_files: {
            type: DataTypes.TEXT
        },
        last_reset_date: {
            type: DataTypes.TEXT
        },
        last_activity: {
          type: DataTypes.DATE
        },
        providers_id: {
            type: DataTypes.TEXT
        },
        medication_reminder: {
          type: DataTypes.INTEGER
        },
        medication: {
          type: DataTypes.BOOLEAN
        }
    }, {
        deletedAt: 'deleted_at',
        paranoid: true,
        tableName: 'monitor',
        classMethods: {
            getOrganizationTag: function(orgId){
                return pushnotifications.getOrganizationTag(orgId, 'montr');
            }
        },
        instanceMethods: {
            /**
            * Has gone out of bounds
            */
            isOutofBounds: function(measurements){
                var result = false;
                if(measurements){
                    measurements.forEach(function(measurement){
                        var isOut = measurement.isOutofBounds();
                        if(isOut && !result){
                            result = true;
                        }
                    });
                }
                return result;
            },

            isEnrolled: function(measurements){
                var result = false;
                if(measurements){
                    measurements.forEach(function(measurement){
                        result = measurement.isEnrolled() || result;
                    });
                }
                return result;
            },

            isAlarMed: function(measurements){
                var result = false;
                if(measurements){
                    measurements.forEach(function(measurement){
                        var isOut = measurement.isAlarMed();
                        if(isOut && !result) result = true;
                    });
                }
                return result;
            },
            /**
            * Is missed
            */
            isMissed: function(measurements){
                if(measurements){
                    var result = false;
                    measurements.forEach(function(measurement){
                        if(measurement.isMissed() && !result){
                            result = true;
                            return true;
                        }
                    });
                    return result ? true : false;
                } else { // TODO: remove it once next_reading field removed from monitor table
                    logger.debug('Warn : using old next reading and process time for monitor ' + this.id);
                    return isMissed(this.next_reading, this.process_time, this.repeat_within_seconds);
                }
            },
            /**
            *  bio missed severity
            */
            bioMissedSeverity: function(measurements){
                if(measurements){
                    var severity = 0;
                    measurements.forEach(function(measurement){
                        if(measurement.missedSeverity()){
                            severity = (measurement.missedSeverity()) > severity ? measurement.missedSeverity() : severity;
                        }
                    });
                    return severity;
                } else { // TODO: remove it once next_reading field removed from monitor table
                    logger.debug('Warn : using old next reading and process time for monitor ' + this.id);
                    return isMissed(this.next_reading, this.process_time, this.repeat_within_seconds, 1, true);
                }
            },
            /**
            * Education stats
            */
            educationInfo: function(documents, events){
                if(documents){
                    var diseases_ids = []
                        , self = this, missed = 0;

                    documents.forEach( function(doc) {
                        var found = false;
                        _.forEach(diseases_ids, function(diseases_id){
                            if(diseases_id == doc.diseases_id){
                                found = true;
                            }
                        });
                        if(!found){
                            diseases_ids.push(doc.diseases_id);
                        }
                    });

                    _.forEach(diseases_ids, function(diseases_id){
                        missed += helpers.getEduMissedForMonitor( self.id, diseases_id, self.start_date, events, documents);
                    });

                    return {status: ((missed) > 0), severity: missed};
                } else {
                    return {status: false, severity: 0};
                }
            },
            /**
            *Is connected
            * return 0 if no measurement is connected with any service
            * return 1 if some measurements are connected with services
            * return 2 if all measurments are connected with services
            */
            isConnected: function(measurements){
                var allFalse = 0, someTrue = 1, allTrue = 2;
                if(measurements){
                    var allConnected = measurements.every(function(measurement){
                        return !!measurement.oauth_id;
                    });

                    if(allConnected){
                        return allTrue;
                    }

                    var someConnected = measurements.some(function(measurement){
                        return !!measurement.oauth_id;
                    });

                    if(someConnected){
                        return someTrue;
                    }
                }
                else {
                    logger.debug('Warn : No measurements found for monitor ' + this.id);
                }
                return allFalse;
            },
            getLastSyncTime : function(){
                return this.getOauthMonitorTokens({
                    include:[{
                        required: true,
                        model: sequelize.models.MeasurementMonitor
                    }]
                }).then(function(services){
                    var response = [];
                    //var alertLastDate = {};
                    services.forEach(function(service){
                        var obj = {
                            service: service.service_name,
                            lastSync: service.last_sync
                        };
                        var outh_data;
                        if(service.oauth_data && typeof service.oauth_data == 'string'){
                            outh_data = JSON.parse(service.oauth_data);
                        }
                        else if(service.oauth_data){
                            outh_data = service.oauth_data;
                        }
                        if((service.service_name == 'c5' || service.service_name == 'eclipse') && outh_data){
                            obj.alertLastDate = null;
                            Object.keys(outh_data).forEach(function(data){
                                if(data && data == 'alerts'){
                                    outh_data.alerts.forEach(function(result){
                                        //console.log('result', result);
                                        obj.alertLastDate = result.endDate;
                                        obj.quantity = result.quantity;
                                    });
                                }
                            });
                        }

                        //if(alertLastDate) obj.alertLastDate = alertLastDate;
                        response.push(obj);
                    });
                    return response;
                });
            },
            /**
            * Return ratio of connected measurements to the total measurments
            */
            connectedRatio : function(measurements){
                var totalMeasurements = measurements.length;
                var connectedMeasurements = 0;

                measurements.forEach(function(measurement){
                    if(measurement.oauth_id) {
                        connectedMeasurements++;
                    }
                });

                return (connectedMeasurements/totalMeasurements).toFixed(2);
            },
            /**
            *Return no of active measurements
            */
            activeMeasurements : function(measurements){
                var activeMeasurements = 0;

                measurements.forEach(function(measurement){
                    if(measurement.oauth_id) {
                        activeMeasurements++;
                    }
                });

                return activeMeasurements;
            },
            /**
            * Update the process time
            */
            updateProcessTime: function(){
                this.process_time = moment().toString();
                logger.trace('Reset process_time field for monitor '+ this.id);
                return this.save();
            },
            /**
            * Reset next reading the repeat interval
            */
            resetMonitorNextReading: function(fromDate){
                fromDate = fromDate || new Date();
                fromDate.setSeconds(fromDate.getSeconds() + this.repeat_within_seconds);
                this.next_reading = fromDate;
                logger.trace('Reset next_reading field for monitor '+ this.id);
                return this.save();
            },
            /**
            * Get measurements maps for monitors
            *
            * @param id,              String, id of MeasurementMonitor
            * @param measurementId,   String, id of measurement
            */

            getMeasurementMaps: function(id, measurementId){
                var self = this;
                var query = {
                    where: {
                        monitor_id: self.id
                    },
                    include: [sequelize.model('Measurement'), sequelize.model('OauthMonitorToken')]
                };
                if(measurementId){
                    query.where.measurement_id = measurementId;
                }
                if(id){
                    query.where.id = id;
                }

                return sequelize.model('MeasurementMonitor').findAll(query);
            },

            /**
            * Get supplied documents for monitors
            *
            * @param diseaseId,     String, id of Disease
            * @param orgId,         String, id of Organization
            */

            getDocuments: function(measurements, orgId){
                var diseases = [];

                measurements.forEach(function(measurement){
                    diseases.push(measurement.diseases_id);
                });

                var query = {
                    where: {
                        diseases_id: {
                            $in: diseases
                        },
                        org_id: orgId
                    }
                };

                return sequelize.model('Document').findAll(query);
            }
        }
    });
};
