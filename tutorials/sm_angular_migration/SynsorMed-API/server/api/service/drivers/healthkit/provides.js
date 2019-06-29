'use strict';

var Provider = require('../base/base').Provider;

var config = {
    name : 'healthkit',
    url  : 'http://developer.apple.com/healthkit',
    display : 'HealthKit',
    version : 0
};

function HealthKitProvider(config){
  Provider.call(this, config);
}

require('util').inherits(HealthKitProvider, Provider);

var currentProvider = new HealthKitProvider(config);

currentProvider
.addMeasurement('steps')
.addMeasurement('heartrate')
.addMeasurement('temperature')
.addMeasurement('breath');

/* Tell what services does this driver provides */
module.exports = currentProvider.getConfig();
