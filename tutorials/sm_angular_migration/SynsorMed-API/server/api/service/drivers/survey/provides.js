'use strict';

var Provider = require('../base/base').Provider;

var config = {
    name : 'survey',
    url  : 'http://developer.apple.com/healthkit',
    display : 'Survey',
    version : 0
};

function HealthKitProvider(config){
  Provider.call(this, config);
}

require('util').inherits(HealthKitProvider, Provider);

var currentProvider = new HealthKitProvider(config);

currentProvider
.addMeasurement('status');

/* Tell what services does this driver provides */
module.exports = currentProvider.getConfig();
