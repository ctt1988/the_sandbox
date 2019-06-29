//global wrapper for all the responses send via drivers
exports.buildAdapter = function(results, driver, message, lastSyncTime){
  return {
    data : results,
    driver : driver,
    message : message,
    lastSyncTime : lastSyncTime || false
  };
};
