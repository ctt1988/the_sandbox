'use strict';

var Q = require('q');
var async = require('async');
var moment = require('moment');
var request = require('request');
var helpers = require('./helpers');

var getUrls = function(baseUrl, userid){
    var urls = [];
    for(var i=160; i >=0; i = i-32){
        var to = moment().subtract(i, 'days').format('YYYY-MM-DD').toString();
        var from =  moment().subtract(i + 31, 'days').format('YYYY-MM-DD').toString();
        urls.push(baseUrl + '1/user/' + userid + '/body/log/weight/date/' + from + '/' + to + '.json');
    }
    return urls;
};

module.exports = function(baseUrl, userid, access_token){
    var defer = Q.defer();
    var tasks = [];
    var urls = getUrls(baseUrl, userid);
    urls.forEach(function(url){
        tasks.push(function(cb){
            request.get({ url: url, headers: {Authorization: 'Bearer ' + access_token} }, function (error, response, body) {
                helpers.asyncReqParser(body, cb);
            });
        });
    });
    async.parallel(tasks, function(err, results){
        if(err) return defer.reject(err);
        var final = { weight: [] };
        results.forEach(function(result){
            var weight = result ? result.weight : null;
            final.weight = final.weight.concat(weight || []);
        });
        defer.resolve(final);
    });
    return defer.promise;
};
