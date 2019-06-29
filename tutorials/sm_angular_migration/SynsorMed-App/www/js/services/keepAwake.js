'use strict';

angular.module('synsormed.services.awake', [])
.service('synsormed.services.awake.awakeService',[
    function(){
        return {
            allowSleep: function(){
                if(window.plugins && window.plugins.insomnia) window.plugins.insomnia.allowSleepAgain();
            },
            keepAwake: function(){
                if(window.plugins && window.plugins.insomnia) window.plugins.insomnia.keepAwake();
            }
        };
    }
]);
