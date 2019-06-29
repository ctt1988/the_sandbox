'use strict';
var config = require('config');
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var cryptoSecretKey = config.encryption.encryptionKey || 'd6F3Efeq';

exports.encrypt = function(plainData){
   if(!plainData) return null;
   var cipher = crypto.createCipher(algorithm, cryptoSecretKey);
   var encryptedData = cipher.update(plainData, 'utf8', 'hex');
       encryptedData += cipher.final('hex');
     return encryptedData;
};

exports.decrypt = function(encryptedData){
    if(!encryptedData) return null;
    var decipher = crypto.createDecipher(algorithm, cryptoSecretKey);
    var plainData = decipher.update(encryptedData, 'hex', 'utf8');
        plainData += decipher.final('utf8');
    return plainData;
};
