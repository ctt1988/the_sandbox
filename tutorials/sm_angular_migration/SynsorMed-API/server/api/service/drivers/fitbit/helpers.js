'use strict';

var _ = require('lodash');
var logger = require('logger');

module.exports.buildUrl = function(url, data, glue){ //buil a url from data
    url = url || '';
    glue = glue || '?';
    var params = []; //prepare url
    _.forEach(data, function(val, key){
        params.push(key + '=' + val);
    });
    return url + glue + params.join('&');
};

module.exports.asyncReqParser = function(body, cb){
    var error = {};
    try{ error = JSON.parse(body); }
    catch(e){ return cb(null, body); }

    if(error.errors){ //if there is error
        logger.error('Rejected API Fitbit ', error);
        return cb(null, error); //but dont return error so we can read other params
    }
    else {
        return cb(null, JSON.parse(body));
    }
};

module.exports.getFitbitUrl = function(url){ //Fitbit Url
    url = url || '';
    return 'https://www.fitbit.com/' + url;
};

module.exports.getAPIBaseUrl = function(url){ //get base url for api
    url = url || '';
    return 'https://api.fitbit.com/' + url;
};

module.exports.userConversion = function(err, data, promise){ //internal callback to parse the response from userauth calls
    if(err){
        return promise.reject(err);
    }
    else{
        data = JSON.parse(data);
        if(data.errors) return promise.reject(data); //if there is error in api
        var current_sec = parseInt((new Date()).getTime() / 1000);
        var resp = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires: current_sec + data.expires_in,
            token_type: data.token_type,
            user_id: data.user_id
        };
        return promise.resolve(resp);
    }
};
