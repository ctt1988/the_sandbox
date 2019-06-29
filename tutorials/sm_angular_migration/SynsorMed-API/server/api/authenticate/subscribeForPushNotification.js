'use strict';

var quickblox = require('../../components/quick-blox');

module.exports = function(patientCode, device, qbUser){
    return quickblox.login(qbUser.login, qbUser.password)
    .then(function(){
         if(!device || device.registrationId == null) return false;
         return quickblox.subscribe(device);
    });
};
