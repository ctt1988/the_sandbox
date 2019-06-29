'use strict';

var waitingTimeRule = require('../server/rules/encounter/getWaitingTime');
var logger = require('logger');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Encounter', {
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
    last_activity: {
      type: DataTypes.DATE
    },
    scheduled_start: {
      type: DataTypes.DATE
    },
    call_ready: {
      type: DataTypes.DATE
    },
    call_started: {
      type: DataTypes.DATE
    },
    reason_for_visit: {
      type: DataTypes.STRING(1000)
    },
    fee: {
      type: DataTypes.DECIMAL(6, 2)
    },
    fee_paid: {
      type: DataTypes.BOOLEAN
    },
    terms_accepted: {
      type: DataTypes.BOOLEAN
    },
    note: {
      type: DataTypes.STRING(1000)
    },
    provider_id: {
      type: DataTypes.INTEGER
    },
    payment_id: {
      type: DataTypes.INTEGER
    },
    rtc_user_id: {
      type: DataTypes.INTEGER
    },
    service_name: {
      type: DataTypes.STRING(50)
    },
    oauth_data: {
      type: DataTypes.TEXT
    },
    duration: {
      type: DataTypes.INTEGER
    },
    is_ccm: {
      type: DataTypes.BOOLEAN
    },
    created_at: {
      type: DataTypes.DATE
    },
    updated_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'encounter',
    instanceMethods: {
      //get the waiting time in the seconds
      getWaitingTime: function() {
        return waitingTimeRule(this.call_started, this.call_ready, this.last_activity, this.scheduled_start);
      },
      //reset encounter call_ready time if call_started is empty
      resetEncounterCallIndicator: function(){
         //get the required attrs
         var call_started = this.call_started ? new Date(this.call_started).getTime() : 0,
             call_ready = this.call_ready ? new Date(this.call_ready).getTime() : 0;

         if(call_started == 0 && call_ready > 0){  //call_started is null , call_ready is not null

             this.updateAttributes({ // set the call_ready to null
               call_ready: null
             })
             .then(function(){
                logger.debug('Reset the call_ready time for encounter ' + this.patient_code);
                logger.trace('Reset the call_ready time for encounter ' + this.patient_code);
             })
             .catch(function(err){
                logger.error(err);
             });

         }
      },
      refreshToken: function(resp){
        logger.trace('Refreshing token for encounter id + '+ this.id);
        return this.updateAttributes({
          oauth_data: JSON.stringify(resp)
        });
      },
      setLastSyncDate : function(lastSyncDate){
          return  new sequelize.Promise(function(resolve){
             resolve(lastSyncDate);
          });
      }

    }
  });
};
