'use strict';

var Provider = require('../base/base').Provider;

var config = {
    name: 'fitbit',
    url: 'http://www.fitbit.com',
    display: 'Fitbit',
    version: 2,
    meta_data: {
        appInfo: {
            ios: { name: 'fitbit://' },
            android: { name: 'com.fitbit.FitbitMobile'}
        }
    }
};

function fitbitProvider(config){
    Provider.call(this, config);
}

require('util').inherits(fitbitProvider, Provider);

var currentProvider = new fitbitProvider(config);

currentProvider
.addMeasurement('steps')
.addMeasurement('sleep')
.addMeasurement('caloric intake')
.addMeasurement('weight');

/* Tell what services does this driver provides */
module.exports = currentProvider.getConfig();
