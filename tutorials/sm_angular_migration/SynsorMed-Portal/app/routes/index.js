'use strict';

var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config/environment');

var cahceVersion = require('../cacheversion')();

//redirect website on https in production mode
router.use(function(req, res, next){

  if(req.headers['x-forwarded-proto'] != 'https' && process.env.NODE_ENV == 'production')
    return res.redirect('https://'+ req.headers.host + req.url);
  else
    return next();
});

/* Load the angular app */
router.get('/', function(req, res) {

    var isDevelopment = process.env.NODE_ENV === 'development' ? true : false;
    var googleMapApiKey = config.googleMapApiKey || null;
    var apiUrl = config.apiURI || null;

    if(!req.cookies['connect.sid']) {
        return res.render('index', { title: 'Express', csrf: null, isDevelopment: isDevelopment, suffix: cahceVersion, googleMapApiKey: googleMapApiKey, apiUrl: apiUrl });
    }
    res.render('index', { title: 'Express', csrf: null, isDevelopment: isDevelopment, suffix: cahceVersion });
});

/* Connect with API */
router.use('/proxy', function (req, res) {
    req.pipe(request(config.apiURI + req.url, function (err) {
        if(err) {
            res.status(500).send(JSON.stringify(err));
        }
    })).pipe(res);

});

module.exports = router;
