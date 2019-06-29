'use strict';

var moment = require('moment');

/**
 * Calculate the missed status
 *
 * @param created_at , DateTime | String , Date of creation
 * @param last_recorded , DateTime |  String , Date when last recorded
 * @param repeat_within_seconds, INTEGER , Reapeat interval for cron job
 * @param sensitivity, INTEGER, sensitivity set by user
 *
 * @return Boolean
 */
module.exports = function(created_at, last_recorded, repeat_within_seconds, sensitivity, checkSeverity){

  repeat_within_seconds = parseInt(repeat_within_seconds) || 86400;
  sensitivity = parseInt(sensitivity) || 1;
  created_at = moment(created_at);
  last_recorded = last_recorded ? moment(last_recorded) : null;

  var creationEpoch = parseInt(created_at.toDate().getTime() / 1000)
    , todayEpoch = parseInt(moment().toDate().getTime() / 1000)
    , lastRecordEpoch = last_recorded ? parseInt(last_recorded.toDate().getTime() / 1000) : 0
    , duration = false;

  //if creation is future, not missed
  if((lastRecordEpoch ? creationEpoch > lastRecordEpoch : false) || creationEpoch > todayEpoch) return false;

  //if creation and recording are same day and in present
  if(created_at.isSame(last_recorded, 'day') && created_at.isSame(moment(), 'day')) return false;

  //if last_recorded is future , then missed;
  if(lastRecordEpoch > todayEpoch){
    if(checkSeverity)
      return 1;
    else
      return true;
  }

  //if it never got recorded and older than repeat interval
  if(!last_recorded && (todayEpoch - (creationEpoch + repeat_within_seconds)) >= repeat_within_seconds){
    duration = todayEpoch - (creationEpoch + repeat_within_seconds);
    if(checkSeverity)
      return Math.round(moment.duration(duration, 'seconds').asDays());
    else
      return true;
  }

  //if(last_recorded && ((todayEpoch - lastRecordEpoch) >= (repeat_within_seconds*sensitivity))){
  if(last_recorded && ((todayEpoch - lastRecordEpoch) >= (repeat_within_seconds))){
    duration = todayEpoch - lastRecordEpoch;
    if(checkSeverity)
      return Math.round(moment.duration(duration, 'seconds').asDays());
    else
      return true;
  }

  return false;
};
