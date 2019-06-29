var NodeCache = require( 'node-cache' );
var storage = new NodeCache();
var Q = require('q');


module.exports.set = function(key, val){
    var defer = Q.defer();
    storage.set( key, val, function(err, success){
        if( !err && success ){
            defer.resolve(true);
        }
        else{
            defer.reject(false);
        }
    });
    return defer.promise;
};

module.exports.get = function(key){
    var defer = Q.defer();
    storage.get( key, function( err, value ){
        if(!err){
            if(value == undefined){
                defer.reject(false);
            }else{
                defer.resolve(value);
            }
        }
        else{
            defer.reject(false);
        }
    });
    return defer.promise;
};

module.exports.clear = function(key){
    var defer = Q.defer();
    storage.del( key, function( err, count ){
        if( !err ){
            defer.resolve(count);
        }
        else{
            defer.reject(false);
        }
    });
    return defer.promise;
};
