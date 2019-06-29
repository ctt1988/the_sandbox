'use strict';

var Provider = require('../base/base').Provider;
var config = {
    name : 'fdk',
    url  : '',
    display : 'FDK',
    version : 0,
    meta_data: {
        devices: ['FDK'],
        services : [
            {
              characteristics: {
                  subscribe: '02005970-6D75-4753-5053-676E6F6C7553',
                  read: 'Not needed'
              },
              uuid: '00005970-6D75-4753-5053-676E6f6C7553'
            }
		]
    }
};

function FdkProvider(config){
    Provider.call(this, config);
}

require('util').inherits(FdkProvider, Provider);

var currentProvider = new FdkProvider(config);

currentProvider /* Tell what services does this driver provides */
.addMeasurement('temperature');

module.exports = currentProvider.getConfig();
