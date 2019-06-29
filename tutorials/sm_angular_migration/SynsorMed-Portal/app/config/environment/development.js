'use strict';

var _ = require('lodash');

process.env = _.merge(
  process.env,
  require('./../local.env') || {});

// Development specific configuration
// ==================================
module.exports = {
    apiDomain: 'localhost:9000',
    apiURI: 'http://localhost:9000',
    port: 8080,
    staticCacheAge: 1,
    googleMapApiKey: null
};
