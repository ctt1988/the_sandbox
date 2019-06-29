'use strict';

var OauthV1 = require('../base/v1'),
adapter = require('./adapter'),
masterAdapter = require('../base/master-adapter'),

async = require('async'),
moment = require('moment'),
Q = require('q');

var logger = require('logger');

var getAPIBaseUrl = function(url){
    return 'https://oauth.withings.com/' + url;
};

var getResourceBaseUrl = function(url){
    return 'https://wbsapi.withings.net/' + url;
};

var redirectURL = 'https://oauth.withings.com/account/authorize?oauth_token=';

var config = {};

/** Configurables **/
config.consumer_key = '0653453bc537834093759e7c8bed608082123d2fbb9091d40001e14d4032';
config.consumer_secret = '19581403c44c29c4e29450e89300d6e83429d32645487dcec59196f1c5489';

config.request_token_url = getAPIBaseUrl('account/request_token');
config.access_token_url = getAPIBaseUrl('account/access_token');
config.authorization_url = getAPIBaseUrl('account/authorize');

config.signature = 'HMAC-SHA1';
config.sessionKey = 'oauth:withings';
/** Configurables Ends **/

var asyncApiCall = function(url, token, token_secret, callback, OauthObject){

  //Withings API need signed urls rather than headers
  var signedUrl = OauthObject.signUrl(url, token, token_secret);

  OauthObject.get(signedUrl, null, null, function(err, body){
      //parse response
      body = JSON.parse(body);

      //yes the success code for withings is 0 not 200
      if(err || body.status !== 0){
        callback(true, body.error);
      } else {
        callback(false, body.body);
      }
  });
};


/** start authorization process **/
exports.run = function(callbackUrl){

  var deferred = Q.defer();

  //get request token
  OauthV1.getRequestToken(config, callbackUrl, function(err, results){

      //if there was some errors
      if(err){
        deferred.reject(results);
        return;
      }

      //set callback url
      results.redirectURL = redirectURL + results.oauth_token;

      deferred.resolve(results);
  });

  return deferred.promise;
};

//get Access token from a fitbit
exports.getAccessToken = function(oauthToken, oauthVerifier, oauthTokenSecret){

  var deferred = Q.defer();

  //internal callback to parse the user id from the services
  var userConversion = function(err, data){
      if(err){
        deferred.reject(data);
        return;
      } else {
          //get user id from response
          var uid = data.raw.userid;

          var rsp = {
            token: data.token,
            token_secret: data.token_secret,
            user_id: uid
          };

          deferred.resolve(rsp);
          return;
      }
  };

  OauthV1.getAccessToken(config, oauthToken, oauthVerifier, oauthTokenSecret, userConversion);

  return deferred.promise;
};

/** Build a profile by calling various apis to access the user data **/
exports.profile = function(oauthData){

  var deferred = Q.defer();

  var token = oauthData.token;
  var token_secret = oauthData.token_secret;
  var user_id = oauthData.user_id;

  //get required dates for today
  var todayUnix = moment().unix();
  var todayYmd = moment().format('YYYY-MM-DD').toString();

  //and for last 30 days
  var ago30dayUnix = moment().startOf('day').subtract(30, 'days').unix();
  var ago30dayYmd = moment().startOf('day').subtract(30, 'days').format('YYYY-MM-DD').toString();

  //prepare the url as the API need
  var getBodyMeasure = getResourceBaseUrl('measure?action=getmeas&userid=' + user_id + '&startdate=' + ago30dayUnix + '&enddate=' + todayUnix);
  var getActivityMeasure = getResourceBaseUrl('v2/measure?action=getactivity&userid=' + user_id + '&startdateymd=' + ago30dayYmd + '&enddateymd=' + todayYmd);

  var OauthObject = OauthV1.buildOAuthObject(config);

  if(OauthObject === false){
    deferred.reject('Error creating Oauth Object');
    return deferred.promise;
  }

  async.parallel([
    function(callback){
        //get weight and blood pressure
        asyncApiCall.call(this, getBodyMeasure, token, token_secret, callback, OauthObject);
    },
    function(callback){
        //get the steps
        asyncApiCall.call(this, getActivityMeasure, token, token_secret, callback, OauthObject);
    }],
    function(err, results){
        //if there was error in parallel run
        if(err){
          deferred.reject(err);
          return;
        }

        var lastSyncTime = adapter.getLastSyncDate(results);
        //parse the results
        results = oauthData.all ? adapter.parseAll(results[0], results[1], oauthData.days) : adapter.parse(results[0], results[1], oauthData.days);
        results = masterAdapter.buildAdapter(results, 'Withings', 'Displaying records for last 30 days.', lastSyncTime);
        deferred.resolve(results);
   });

    return deferred.promise;
};

module.exports = exports;
