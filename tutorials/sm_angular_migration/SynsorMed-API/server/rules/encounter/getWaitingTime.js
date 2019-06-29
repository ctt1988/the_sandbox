"use strict";

module.exports = function(call_started, call_ready, last_activity, scheduled_start){

  var callStarted = call_started ? new Date(call_started).getTime() : 0,
  callReady = call_ready ? new Date(call_ready).getTime() : 0,
  lastActivity = last_activity ? new Date(last_activity).getTime() : 0,
  tZero = new Date(scheduled_start).setHours(0, 0, 0, 0);

  //we have both call_started and call_ready time
  if(callReady > 0 && callStarted > 0){
    return (callStarted - callReady) / 1000;
  }

  //if we have only call_ready
  if(callReady > 0){

    var t1 = new Date(call_ready).setHours(0, 0, 0, 0);
    var t2 = new Date(last_activity).setHours(0, 0, 0, 0);

    //and call ready was set today
    if(t1 === tZero && t1 === t2){
      return (lastActivity - callReady) / 1000;
    }
  }

  //other wise return N/A
  return 0;
};
