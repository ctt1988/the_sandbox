angular.module('synsormed.services.timer',[])
.service('synsormed.services.TimerService', ['$interval', function ($interval) {
    var callStartTime = null, timer = null, duration = null;
    var startTimer = function(task, startDate){
        callStartTime = startDate || moment();
        timer = $interval(function(){
            var callEndTime = moment();
            duration = moment.duration(callEndTime.diff(callStartTime));
           if(task) task(duration);
        }, 1000);
    };

    var cancelTimer = function(callBackTask){
        if(timer)$interval.cancel(timer);
        if(duration){
            var hoursInSeconds = duration.hours()*3600;
            var minutesInSeconds =duration.minutes()*60;
            var durationInSeconds = hoursInSeconds + minutesInSeconds + duration.seconds();
            if(callBackTask) callBackTask(durationInSeconds);
        }
    };

    return {
        startTimer: startTimer,
        cancelTimer: cancelTimer
      };
}]);
