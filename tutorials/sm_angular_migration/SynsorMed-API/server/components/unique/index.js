var Q = require('q');

var models = require('models');
var EncounterModel = models.Encounter;
var MonitorModel   = models.Monitor;
var OrganizationModel = models.Organization;

//generate a unique code
var makeid = function() {
    var text = "";
    var possible = "ABCDEFGHJKLMNPRSTUVWXYZ23456789";

    for( var i=0; i < 7; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


exports.generateUniqueCode = function(){
    var deferred = Q.defer();
    var code = makeid();

    //if any encounter with this code exists
    EncounterModel.count({where: { patient_code: code }}).then(function (count) {
        if(count === 0) {
            //if any monitor with this code exists
            MonitorModel.count({where: { patient_code: code }}).then(function (count) {
                if(count === 0) {
                    deferred.resolve(code);
                } else {
                    exports.generateUniqueCode().then(deferred.resolve);
                }
            });
        } else {
            exports.generateUniqueCode().then(deferred.resolve);
        }
    })
    .catch(function(e){
      deferred.reject(e)
    })

    return deferred.promise;
};

exports.generateUniqueOtp = function(){
    var deferred = Q.defer();
    var code = makeid();

    //if any encounter with this code exists
    OrganizationModel.count({where: { otp: OrganizationModel.encryptOtp(code) }}).then(function (count) {
        if(count === 0) {
            deferred.resolve(code);
        } else {
            exports.generateUniqueOtp().then(deferred.resolve);
        }
    })
    .catch(function(e){
        deferred.reject(e)
    })

    return deferred.promise;
};
