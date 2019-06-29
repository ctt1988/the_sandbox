'use strict';

var Provider = require('../base/base').Provider;
var config = {
    name : 'and',
    url  : '',
    display : 'A&D',
    version : 0,
    meta_data: {
        devices: ['013171'],
        services : [
            {
              characteristics: {
                  subscribe: '23434101-1FE4-1EFF-80CB-00FF78297D8B',
                  read: 'Not needed'
              },
              uuid: '23434100-1FE4-1EFF-80CB-00FF78297D8B'
            }
		]
    }
};

function AndProvider(config){
    Provider.call(this, config);
}

require('util').inherits(AndProvider, Provider);

var currentProvider = new AndProvider(config);

currentProvider /* Tell what services does this driver provides */
.addMeasurement('weight');

module.exports = currentProvider.getConfig();
