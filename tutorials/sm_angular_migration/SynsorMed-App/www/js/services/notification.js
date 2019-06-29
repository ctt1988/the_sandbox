angular.module('synsormed.services.notification',[])

//service which will provide methods to send notifications to device
// it require plugin https://github.com/katzer/cordova-plugin-local-notifications
.service('synsormed.services.notification.NotificationMarshalService',function(){
     if(typeof cordova === 'undefined' || !((cordova.plugins || {}).notification || {}).local ){
        console.error("Notification plugin not found. Please install https://github.com/katzer/cordova-plugin-local-notifications");
     }

     return {
       // build an object that represent an notification
       genNotificationObject : function(id,title,text,at,data,badge){
         return {
           id : id,
           title : title,
           text : text,
           at : at,
           data : data || null,
           badge : badge || 0
         };
       },
       setNotifications : function(data){
         cordova.plugins.notification.local.schedule(data);
       },
       clearAll : function(){
         cordova.plugins.notification.local.clearAll(function() {}, this);
       }
     }
})

.provider('synsormed.services.notification.NotificationSchedulerService',[
  function(){
     var worklist = null;

     // title for notifications
     var title = "SynsorMed";

     // time in seconds,
     //A notification will be send this many second before the actual event
     var timegap = 10 * 60;

     // set the custom title
     this.setTitle = function(title){
       title = title;
     };

     //set the custom time gap
     this.setTimegap = function(seconds){
         if(!isNaN(seconds)){
           timegap = seconds;
         }
     }

     // this function modify the Datetime object passed to take account the timegap
     var performTimegap = function(obj){
        return obj ? new Date(obj.getTime() - (timegap * 1000)) : new Date();
     };

     this.$get = [
       '$filter',
       'synsormed.services.notification.NotificationMarshalService',
       function($filter,NotificationMarshalService){
         return {

           //set notification for all know encounter in advance,
           //failsafe again iOS mobile safari which wont let us run our code in background
           setNotificationForFurture : function(){

             console.log("Setting Notification for future");

             //there are no encounters
             if(worklist.length == 0){
               return true;
             }

             var notis = [];

             //for every encounter get notifications
             angular.forEach(worklist,function(encounter){
               var now          = new Date(),
                   scheduleTime = new Date(encounter.scheduledStartTime),
                   willSentOn   = performTimegap(scheduleTime),
                   diffInSec    = (scheduleTime.getTime() - willSentOn.getTime()) / 1000;

               //notify about only future appointment
               if(scheduleTime.getTime() > now.getTime()){
                 var notiString = "Appointment(" + encounter.code +") will start in " +
                                  $filter('secondsToHoursString')(parseInt(diffInSec));
                 notis.push(NotificationMarshalService.genNotificationObject(encounter.id,title,notiString,willSentOn,null,0));
                 console.log("Sending notification " +encounter.id+ " on " + willSentOn);
               };

             });

             //set notifications
             NotificationMarshalService.setNotifications(notis);

           },

           //at any moment change / update the worklist
           updatedNotifyingList : function(data){
             worklist = data;
           },

           //remove all notification set by app
           removeNotifications : function(){
             NotificationMarshalService.clearAll();
           }
         };
     }];
}]);
