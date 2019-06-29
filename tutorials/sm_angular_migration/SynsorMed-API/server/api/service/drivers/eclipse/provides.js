'use strict';

var Provider = require('../base/base').Provider;

var config = {
    name : 'eclipse',
    url  : '',
    display : 'Eclipse 5',
    version : 0,
    meta_data: {
        devices: ['Eclipse'],
        services : [
            {
              characteristics: {
                  subscribe: '0003CDD1-0000-1000-8000-00805F9B0131',
                  read: '0003CDD2-0000-1000-8000-00805F9B0131'
              },
              uuid: '0003CDD0-0000-1000-8000-00805F9B0131'
            }
        ]
    }
};

function OxygenProvider(config){
  Provider.call(this, config);
}

require('util').inherits(OxygenProvider, Provider);

var currentProvider = new OxygenProvider(config);

currentProvider
.addMeasurement('oxygen flow')
.addMeasurement('breath');

/* Tell what services does this driver provides */
module.exports = currentProvider.getConfig();
