'use strict';

var Provider = require('../base/base').Provider;

var config = {
    name: 'jawbone',
    url: 'https://jawbone.com',
    display: 'Jawbone',
    version: 2,
    meta_data: {
        appInfo: {
            ios: { name: 'jawbone-up2://' },
            android: { name: 'com.jawbone.upopen'}
        }
    }
};

function JawboneProvider(config){
  Provider.call(this, config);
}

require('util').inherits(JawboneProvider, Provider);

var currentProvider = new JawboneProvider(config);

currentProvider
.addMeasurement("sleep")
.addMeasurement("steps");
//.addMeasurement("heartrate")
//.addMeasurement("weight")

/* Tell what services does this driver provides */
module.exports = currentProvider.getConfig();
