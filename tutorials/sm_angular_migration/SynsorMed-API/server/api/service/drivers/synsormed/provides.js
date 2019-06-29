'use strict';

var Provider = require('../base/base').Provider;

var config = {
    name : 'synsormed',
    url  : 'http://portal.synsormed.com',
    display : 'SynsorMed',
    version : 3
};

function SynsorMedProvider(config){
  Provider.call(this, config);
}

require('util').inherits(SynsorMedProvider, Provider);

var currentProvider = new SynsorMedProvider(config);

currentProvider /* Tell what services does this driver provides */
.addMeasurement('steps')
.addMeasurement('weight')
.addMeasurement('glucose')
.addMeasurement('heartrate')
.addMeasurement('temperature')
.addMeasurement('peak flow rate')
.addMeasurement('caloric intake')
.addMeasurement('blood pressure')
.addMeasurement('oxygen saturation');

module.exports = currentProvider.getConfig();
