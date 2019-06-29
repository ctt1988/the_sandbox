'use strict';

module.exports = function(lastActivity){
    var cutoffDate = new Date();
        cutoffDate.setSeconds(cutoffDate.getSeconds() - 60);
    return (lastActivity >= cutoffDate);
};
