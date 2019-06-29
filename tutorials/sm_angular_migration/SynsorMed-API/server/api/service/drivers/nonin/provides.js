'use strict';

var Provider = require('../base/base').Provider;
var config = {
    name : 'nonin',
    url  : '',
    display : 'Nonin',
    version : 0,
    meta_data: {
        devices: ['Nonin3230'],
        services : [
            {
              characteristics: {
                  subscribe: '0AAD7EA0-0D60-11E2-8E3C-0002A5D5C51B',
                  read: '1447AF80-0D60-11E2-88B6-0002A5D5C51B'
              },
              uuid: '46A970E0-0D5F-11E2-8B5E-0002A5D5C51B'
            }
		]
    }
};

function NoinProvider(config){
    Provider.call(this, config);
}

require('util').inherits(NoinProvider, Provider);

var currentProvider = new NoinProvider(config);

currentProvider /* Tell what services does this driver provides */
.addMeasurement('oxygen saturation');

module.exports = currentProvider.getConfig();
