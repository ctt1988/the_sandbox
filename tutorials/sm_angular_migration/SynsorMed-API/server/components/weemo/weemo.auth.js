//
// Weemo Client
//
// Tom Sheffler
// Februrary 2014

var https = require('https');
var fs = require('fs');
var url = require('url');
var util = require('util');
var Q = require('q');
var config = require('config');
var logger = require('logger');

var path = require('path');

var weemoConfigRoot = path.normalize(__dirname + '/../config/weemo/');
// Path to the Weemo CA Cert
var WEEMO_CACERT = weemoConfigRoot + 'weemo-ca.pem';

// Paths to the extracted key and cert from the client.p12 file
var WEEMO_CLIENTP12 = weemoConfigRoot + 'client.p12';

//WeemoAuth(process.env.WEEMO_AUTH_URL, WEEMO_CACERT, WEEMO_CLIENTP12, process.env.WEEMO_CLIENTP12PASS, process.env.WEEMO_CLIENT_ID, process.env.WEEMO_CLIENT_SECRET);
//auth_url, ca_file, clientP12, clientp12_password, client_id, client_secret

var auth_url = config.get('weemo.auth_url'),
  ca_file = path.normalize(__dirname + '/../../../config/weemo/weemo-ca.pem'),
  clientP12 = path.normalize(__dirname + '/../../../config/weemo/client.p12'),
  clientp12_password = config.get('weemo.client_pass'),
  client_id = config.get('weemo.client_id'),
  client_secret = config.get('weemo.client_secret');


var auth = function(uid, domain, profile) {
  var uri = url.parse(auth_url);
  logger.info(['uri.host', uri.host]);
  logger.info(['uri.port', uri.port]);

  // see https://github.com/joyent/node/issues/2558#issuecomment-3541447
  var weemo_agent = new https.Agent({
    pfx:    fs.readFileSync(clientP12),
    ca:     fs.readFileSync(ca_file),
    passphrase: clientp12_password
    // rejectUnauthorized: false,
    //secureProtocol: 'SSLv3_method'
  });


  var options = {
    hostname: uri.host,
    port: uri.port,
    path: util.format('/auth?client_id=%s&client_secret=%s', client_id, client_secret),
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    agent: weemo_agent
  };

  // var options = {
  //   hostname: uri.host,
  //   port: uri.port,
  //   path: util.format('/auth?client_id=%s&client_secret=%s', client_id, client_secret),
  //   method: 'POST',
  //
  //   key:    fs.readFileSync(private_key),
  //   cert:   fs.readFileSync(public_cert),
  //   ca:     fs.readFileSync(ca_file),
  //   requestCert:        true,
  //   rejectUnauthorized: false,
  //   passphrase: cert_password,
  //   secureProtocol: 'SSLv3_method',
  //
  //   // follow_location
  //   // certtype = 'PEM'
  //
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded'
  //   }
  // };

  var body = util.format('uid=%s&identifier_client=%s&id_profile=%s', uid, domain, profile);
  options.headers['Content-Length'] = body.length;

  var deferred = Q.defer();


  var req = https.request(options, function(res) {
    var body = '';
    res.on('data', function(d) {
      logger.info('POST result:\n');
      process.stdout.write(d);
      body += d;
    });

    res.on('end', function() {
      logger.info('response ended');
      deferred.resolve(JSON.parse(body).token);
    });
  });

  req.write(body);
  req.end();
  req.on('error', function(e) {
    logger.error(e);
    deferred.reject(e, body);
  });
  return deferred.promise;
};



module.exports = {
  auth: auth
};
