'use strict';

var Provider = require('../base/base').Provider;
var config = {
    name : 'synsortrack',
    url  : '',
    display : 'SynsorTrack',
    version : 0,
    meta_data: {
        devices: ['PC-100', 'eBody-Scale', 'POD'],
        weightServices: [{
            characteristics: {
                subscribe: 'FFF4',
                read: 'FFF4'
            },
            uuid: 'FFF0'
        }],
        services : [
            {
              characteristics: {
                  subscribe: 'FFF1',
                  read: 'FFF1'
              },
              uuid: 'FFF0'
            }
		]
    }
};

function SynsorTrackProvider(config){
    Provider.call(this, config);
}

require('util').inherits(SynsorTrackProvider, Provider);

var currentProvider = new SynsorTrackProvider(config);

 currentProvider /* Tell what services does this driver provides */
 .addMeasurement('weight')
 .addMeasurement('heartrate')
 .addMeasurement('blood pressure')
 .addMeasurement('oxygen saturation')
 .addMeasurement('glucose');

module.exports = currentProvider.getConfig();
