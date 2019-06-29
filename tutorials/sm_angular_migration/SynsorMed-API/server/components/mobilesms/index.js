'use strict';
var config = require('config');
if(config.plivo){
    var authId = config.get('plivo.authId');
    var authToken = config.get('plivo.authToken');
}
var mock = config.get('sms.mock');
if(authId && authToken){
    var api = require('plivo').RestAPI({
        authId: authId,
        authToken: authToken
    });
}
var Q = require('q');
var logger = require('logger');

var sendMessage = function(params){
    var deferred = Q.defer();
    if(!mock){
        if(!authId && ! authToken){
            logger.error('Plivo AuthId and AuthToken is missing');
            return deferred.reject('Plivo AuthId and AuthToken is missing');
        }
        api.send_message(params, function(status, response) {
            if(response.error){
                deferred.reject(response.error);
                logger.error('Error while sending message to ' + params.dst);
            }
            else{
                logger.info('Message successfully sent to '+params.dst);
                deferred.resolve(response);
            }
        });
    }
    else{
        logger.info('Mock Message successfully sent to '+params.dst);
        deferred.resolve(true);
    }
    return deferred.promise;
};

exports.sendMobileMessage = function(to, message, country_code){
    country_code = country_code || '1'; // by default USA
    to = ( (typeof to) == 'string' ) ? to : to.toString();
    var params = {
         src: '18052258869',  // sender
         dst: country_code + to,  // reciever
         text: message  // message
    };
    return sendMessage(params);
};
