'use strict';
var Q = require('q');

module.exports = function(username){
    var defer = Q.defer();
    if(!username) return defer.reject('username is required');
    var password = username + 'password';
        defer.resolve({username: username, password: password});
    return defer.promise;
};
