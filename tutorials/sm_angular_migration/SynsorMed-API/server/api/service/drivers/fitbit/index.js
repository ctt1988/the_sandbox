'use strict';

var Q = require('q');
var async = require('async');
var logger = require('logger');
var moment = require('moment');
var request = require('request');
var adapter = require('./adapter');
var helpers = require('./helpers');
var getTasks = require('./tasks');
var masterAdapter = require('../base/master-adapter');
var tokenConfig = require('./config')(process.env.NODE_ENV);

var TokenExpiryOffset = 60; //second which are added when checking for a token expiry.
var config = {};

/** Configurables **/
config.client_id = tokenConfig.client_id;
config.client_secret = tokenConfig.client_secret;
config.scope = 'activity sleep weight profile settings nutrition';
config.apiUrl = helpers.getAPIBaseUrl();
config.authorization_url = 'oauth2/authorize';
config.access_token_url = 'oauth2/token';
config.refresh_token_url = 'oauth2/token';
/** Configurables Ends **/

var redirectURL = helpers.getFitbitUrl(config.authorization_url);
var getAPITokenUrl = helpers.getAPIBaseUrl(config.access_token_url);

var getRequestHeaders = function(){
    //Converting client_id:client_secret to base64 string
    var base64Code = new Buffer(config.client_id + ':' + config.client_secret).toString('base64');
    return {
        'Authorization': 'Basic ' + base64Code,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
};

/** prepare a url where user should be redirected and begin the oauth **/
exports.run = function(callbackUrl, sessionTokenId){
    var data = { //this is all the data to be sent
        client_id: config.client_id,
        response_type: 'code',
        scope: config.scope,
        state: sessionTokenId, //send session token so we can relogin the user
        redirect_uri: callbackUrl
    };
    callbackUrl = helpers.buildUrl(redirectURL, data);
    return callbackUrl;
};

//get Access token from Fitbit
exports.getAccessToken = function(code, callbackUrl, state){
    var deferred = Q.defer();
    var data = {
        client_id: config.client_id,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        code: code
    };
    request.post({
        url: getAPITokenUrl,
        headers: getRequestHeaders(),
        form: data
    },
    function (error, response, body) {
        if (!error && response.statusCode === 200) helpers.userConversion(null, body, deferred);
        else helpers.userConversion(error, body, deferred);
    });
    return deferred.promise;
};


//get Access token from Fitbit using refresh token
exports.getAccessTokenViaRefreshToken = function(refresh_token){
    var deferred = Q.defer();

    var data = {
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
    };

    request.post({
        url: getAPITokenUrl,
        headers: getRequestHeaders(),
        form: data
    },
    function (error, response, body) {
        if (!error && response.statusCode === 200) helpers.userConversion(null, body, deferred);
        else helpers.userConversion(error, body, deferred);
    });

    return deferred.promise;
};

//check if a token is expired or not
exports.tokenExpired = function(token_unix){
    var current_sec = parseInt((new Date()).getTime() / 1000);
    //check if the token  are going to expire in next minute
    return ((current_sec + TokenExpiryOffset) > token_unix);
};

//check if token expired , perform regain of token and update it to model
exports.ensureAccessToken = function(oauthData){

    var deferred = Q.defer();

    //if access token is expired
    if(exports.tokenExpired(oauthData.expires)){
        logger.debug('Getting new access token for Fitbit');
        //request for new access tokens
        exports
        .getAccessTokenViaRefreshToken(oauthData.refresh_token)
        .then(function(resp){
            //we have some new data need to update to model
            return oauthData.oauthModelInstance
              .refreshToken(resp)
              .then(function(){
                deferred.resolve(resp.access_token);
              });
        })
        .catch(function(e){
            deferred.reject(e);
        });
    } else {
        logger.debug('Using old access token for Fitbit');
        deferred.resolve(oauthData.access_token);
    }

    return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData, callbackUrl, measurementName){

    var deferred = Q.defer();
    var userid = oauthData.user_id;


    //test token and get data
    exports
    .ensureAccessToken(oauthData, callbackUrl)
    .then(function(access_token){
        var tasks = getTasks(config.apiUrl, userid, access_token, measurementName);
        async.parallel(tasks, function(err, results){
            if(err) return deferred.reject(err); //send errors back
            var lastSyncTime = adapter.getLastSyncDate(results);
            results = oauthData.all ? adapter.parseAll(results, oauthData.days) : adapter.parse(results);
            results = masterAdapter.buildAdapter(results, 'Fitbit', 'From Fitbit\'s last 30 day records.', lastSyncTime);
            deferred.resolve(results);
        });
    })
    .catch(function(e){
        deferred.reject(e);
    });

    return deferred.promise;

};

/** check if oauthdata is expired or not **/
exports.expireCheck = function(oauthData, callbackUrl){
    var deferred = Q.defer();
    var userid = oauthData.user_id;
    var today = moment().format('YYYY-MM-DD').toString();
    var stepsUrl = helpers.getAPIBaseUrl() + '1/user/' + userid + '/activities/steps/date/' + today + '/30d.json';
    //test token and get data
    exports.ensureAccessToken(oauthData, callbackUrl)
    .then(function(access_token){
         request({url: stepsUrl, headers: {Authorization: 'Bearer ' + access_token}}, function (error, response, body) {
            if (!error && response.statusCode === 200){
                body = JSON.parse(body);
                if(body.errors) return deferred.resolve(false);
                else  return deferred.resolve(true);
            }
            else{
                return deferred.reject(false);
            }
        });
    })
    .catch(function(e){
        deferred.reject(e);
    });

    return deferred.promise;
};
